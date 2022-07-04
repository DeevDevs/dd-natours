// our util that unifies errors' content (наша утилита для унификации появляющихся ошибок)
const AppError = require('../utils/appError');

// proper operational error generating functions, which are created for MongoDB types of errors. (функции для обработки ошибок типа MongoDB)
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = err => {
  const message = `${err.keyValue.name} value already exists. Please, use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// these function generate JWT-related errors (жти функции обрабатывают ошибки связанные с JWT токенами)
const handleJWTError = () => new AppError('Invalid Token. Please, login again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please, login again.', 401);

// displays the error in development (обрабатывает ошибки на этапе разработки)
const sendErrorDev = (err, req, res) => {
  // in case of API errors, the info goes to the log with all details and stack (API ошибки отражаются в логах с деталями и стаком)
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // in other cases, the error info is diplayed in the website with the message (иные ошибки отображатся на веб странице с сообщением об ошибке)
  console.error('!!!ERROR!!!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message
  });
};

// displays the error in production (отображает ошибки на этапе продакшн)
const sendErrorProd = (err, req, res) => {
  // in case of API errors, we check if the error is trusted (в API, мы проверяем, проверена ли ошибка)
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      // and, if so, send it to the client (и если да - отсылаем пользователю сообщение об ошибке)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // if the error is unknown, we send it to the log (если ошибка не знакома, отражаем в логах)
    console.error('!!!ERROR!!!', err);
    // and return the error message (и возвращаем пользователю сообщение по умолчанию)
    return res.status(500).json({
      status: 'error',
      message: 'Oops, something went wrong =('
    });
  }
  // in the website (на веб странице)
  if (err.isOperational) {
    // trusted errors are rendered (проверенные ошибки отображаются на странице)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message
    });
  }
  // and unknown errors are displayed in log (а незнакомые ошибки отображаются в логах)
  console.error('!!!ERROR!!!', err);
  // and the error message does not display error details (тогда как сообщение ренедрится по умолчанию)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: 'Please, try again later'
  });
};

// it is a global error handler (это модуль экспортирует глобальный обработчик ошибок)
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // it checks if the environment is development or prodution (проверяет среду, в которой работает код)
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let errCopy = JSON.parse(JSON.stringify(err));
    errCopy.message = err.message;
    // known mongoose operational errors are processed through the functions above and the messages are shown to the users (и в случаях когда ошибки нам знакомы, обрабатывает их должным образом с помощью функций выше)
    if (errCopy.name === 'CastError') errCopy = handleCastErrorDB(errCopy);
    if (errCopy.code === 11000) errCopy = handleDuplicateFieldsDB(errCopy);
    if (errCopy.name === 'ValidationError') errCopy = handleValidationErrorDB(errCopy);
    if (errCopy.name === 'JsonWebTokenError') errCopy = handleJWTError();
    if (errCopy.name === 'TokenExpiredError') errCopy = handleJWTExpiredError();

    sendErrorProd(errCopy, req, res);
  }
};
