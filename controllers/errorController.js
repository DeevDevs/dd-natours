const AppError = require('../utils/appError');

// proper operational error generating functions ... they are created for MongoDB types of errors
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

const handleJWTError = () => new AppError('Invalid Token. Please, login again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please, login again.', 401);

const sendErrorDev = (err, req, res) => {
  //the logic is - if request URL starts with 'api', then it goes to production error handler. If not, it is development error...
  if (req.originalUrl.startsWith('/api')) {
    // ERROR DISPLAYED THROUGH DEVELOPMENT
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //1. Log for details
  console.error('!!!ERROR!!!', err);
  //2. RENDERED IN WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      // Operational, trusted error --> sending message to the client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Unknown error --> do not leak error details
    //1.send Error Details
    console.error('!!!ERROR!!!', err);
    //2. return the error message
    return res.status(500).json({
      status: 'error',
      message: 'Oops, something went wrong =('
    });
  }
  //RENDERED WEBSITE
  if (err.isOperational) {
    // Operational, trusted error --> sending message to the client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message
    });
  }
  //1.send Error Details
  console.error('!!!ERROR!!!', err);
  //2. return the error message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: 'Please, try again later'
  });
};

//THIS IS A GLOBAL ERROR HANDLER
module.exports = (err, req, res, next) => {
  // console.log('I was triggered');
  // console.log(err);
  //   console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let errCopy = JSON.parse(JSON.stringify(err));
    errCopy.message = err.message;
    // console.log(errCopy);
    //there are certain Mongoose errors, and they have exact names. So, these errors are operational errors and we have to let clients know about them. So, we handle these errors using certain error generating function
    // res.status(err.statusCode).json({ err });
    if (errCopy.name === 'CastError') errCopy = handleCastErrorDB(errCopy);
    if (errCopy.code === 11000) errCopy = handleDuplicateFieldsDB(errCopy);
    if (errCopy.name === 'ValidationError') errCopy = handleValidationErrorDB(errCopy);
    if (errCopy.name === 'JsonWebTokenError') errCopy = handleJWTError();
    if (errCopy.name === 'TokenExpiredError') errCopy = handleJWTExpiredError();
    // console.log(err.message);
    // console.log(errCopy.message);
    sendErrorProd(errCopy, req, res);
  }

  // console.log('Error is handled globally');
};
