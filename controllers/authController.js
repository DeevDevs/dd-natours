// it promisifies the returned value to make it awaited (превращает результат функции в обещание)
const { promisify } = require('util');
// it allows to use JWT technology for the req/res cycle security (позволяет внедрить технологию JWT)
const jwt = require('jsonwebtoken');
// use model based on the mongoose schema (использует модель на основе mongoose схемы)
const User = require('./../models/userModel');
// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('./../utils/catchAsync');
// one of our utils that catches the errors (наша утилита для обработки ошибок)
const AppError = require('./../utils/appError');
// one of our utils that sends an email in case of a new user or password change. It is only implemented for one address at mailtrap, and is not yet reflected in the frontend. (наша утилита, которая отправляет имейл пользователю в случае восстановления пароля. Тут, имейл адрес один, и находится в mailtrap, и этот функционал не применен в фронтенд)
const Email = require('./../utils/sendEmail');
// allows to encrypt and decrypt data (позволяет зашифровывать и расшифровывать данные)
const crypto = require('crypto');

// a supporting function that creates a JWT token (вспомогательная функция, которая создает JWT токен)
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }); // arg1: payload, arg2: secret, arg3: expiration_timer
};

/**
 * creates a cookie with the JWT token and adds it to response object (создает cookie с JWT токеном и добавляет его в ответ)
 * @param {object, number, reqObject, resObject}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
const createSendToken = (user, statusCode, req, res) => {
  // creates a unique JWT token (создает уникальный токен)
  const token = signToken(user._id);
  // sets cookie options (создает настройки для cookie)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  // makes sure the connection is secure (проверяет безопасность соединения)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') cookieOptions.secure = true; // this is specific for HEROKU (это необходимо для работы с Heroku)
  // adds a cookie to response object (добавляет cookie в ответ)
  res.cookie('jwt', token, cookieOptions);
  // hides the user password (прячет пароль пользователя)
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

/**
 * creates a new user in the database (создает нового пользователя в базе данных)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.signup = catchAsync(async (req, res, next) => {
  // a new user object is created through schema (создает документ с данными пользователя)
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role === 'admin' ? undefined : req.body.role, // This is to prevent the user from signing as admin (не дает возможность пользователю зарегистрироваться в качестве администратора)
    passwordConfirm: req.body.passwordConfirm
  });
  // sends a welcome email, which is not yet implemented in frontend (отправляет имейл-приветствие. Что пока не применено в фронтенде)
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // create and send token for the logged in session (отправляет токен для авторизованной сессии)
  createSendToken(newUser, 201, req, res);
});

/**
 * logs the user in (авторизует пользователя)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // checks if email and password were entered (проверяет наличие имейла и пароля в полях ввода)
  if (!email || !password) {
    return next(new AppError('Please, provide email and password', 400));
  }
  // retrieve the encrypted password from the user profile (выводит зашифрованный пароль из базы данных)
  const user = await User.findOne({ email }).select('+password');
  // check if the entered password is correct (проверяет пароль)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // create and send token for the logged in session (отправляет токен для авторизованной сессии)
  createSendToken(user, 200, req, res);
});

/**
 * logs the user out (позволяет пользователю выйти из профиля)
 * @param {reqObject, resObject}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.logout = (req, res) => {
  //replace the JWT token in the cookie with some non-token string (заменяет JWT токен белибердой =) )
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

/**
 * checks if the user is logged in and adds his info to the locale for future use (проверяет, залогинился ли пользователь, и сохраняет его данные в ответе)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // verify the token (проверяет токен)
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      // check if the user still exists (проверяет, существует ли все еще пользователь)
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // check if the user changed the password after the token was issued (проверяет, менялся ли пароль после входа)
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // creates a document in response for future use (сохраняет данные в ответе)
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

/**
 * checks if the user is logged in when trying to access protected routes (проверяет пользователя, если н пытается пройти по защищенным маршрутам)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.protect = catchAsync(async (req, res, next) => {
  // check the token presence in headers or in cookies (проверяет наличие токена в headers и cookies)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;
  if (!token) {
    return next(new AppError('You are not logged in. Please, log in to get access', 401));
  }
  // verify the token using the secret (проверяет токен)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // check if the user still exists (проверяет, существует ли пользователь)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does not exist', 401));
  }
  // check if the password was changed after the token issuance (проверяет, менялся ли пароль после выдачи токена)
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('The user changed the password after the token was issued', 401));
  }
  // store user data (сохраняет данные пользователя в объектах запроса и ответа)
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

/**
 * checks the user role and grants/restrict access to certain routes (проверяет роль пользователя для определенных маршрутов)
 * @param {multipleStrings}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * initiantes password reset process, which is not yet implemented in frontend (запускает процесс восстановления пароля. Этот функционал еще не добавлен в фронтенд)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // finds user informaton (находит данные пользователя)
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with such email', 404));
  }
  // generates sign token in the userModel (создает специальный токен через модель пользователя)
  const resetToken = user.createPasswordResetToken();
  // save token and date in the user profile (сохраняет токен в документе пользователя)
  await user.save({ validateBeforeSave: false });
  // create access link for password reset (создает ссылку для восстановления пароля)
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  // try to send an email with the link (it goes to mailtrap, as the users are fake) / пытается отправить ссылку по имейлу (в данном случае в mailtrapб, потому что имейлы пользователей выдуманы)
  try {
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    // empty reset-related fields and display error message (при ошибке, удаляет данные токена и выводит ошибку)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sendind an email. Please, try again later.', 500));
  }
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email'
  });
});

/**
 * resets user password, which is not yet implemented in frontend (восстанавливает пароль пользователя, но эта функиия пока не доступна в фронтенде)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // checks if the token in the params same to the one stored in the user document (проверяет токен, который находится в параметрах ссылки)
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // also checks if it has not expired (проверяет, не истек ли срок годности ссылки)
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });
  // set a new password if token has not expired (устанавливает и сохраняет новый пароль)
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // create and send token for the logged in session (отправляет токен для авторизованной сессии)
  createSendToken(user, 200, req, res);
});

/**
 * updates user password in the profile page (обновляет пароль через профиль пользователя на сайте)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // find the user document in the DB (находит документ пользователя в базе данных)
  const user = await User.findById(req.user._id).select('+password');
  // check if old password is correct (проверяет старый пароль)
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Please, enter your current password correctly', 401));
  }
  // validate and save new password (проверяет и сохраняет новый пароль)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // create and send token for the logged in session (отправляет токен для авторизованной сессии)
  createSendToken(user, 200, req, res);
});
