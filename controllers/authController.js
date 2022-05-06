//this util object contains methods built in node, such as promisify
// const util = require('util');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// const sendEmail = require('./../utils/sendEmail');
const Email = require('./../utils/sendEmail');
const crypto = require('crypto');
// const { cookie } = require('express/lib/response');

const signToken = id => {
  // return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }); // arg1: payload, arg2: secret, arg3: expiration_timer
};

//refactoring... this is to send responses
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //these are cookie Options
  const cookieOptions = {
    //we make it exprire in 90 days
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //we make it only work in https, so we make it false for the development environment
    // secure: true,
    //we make it unchangeable by the browser (like, receive, read, send only)
    httpOnly: true
  };
  //here, if statement makes it work only in production (when we user secure connection - https)
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //this is how we create/send a cookie ...
  res.cookie('jwt', token, cookieOptions);

  //here, we send the entire user profile to the server, but it happens only when we create a new user profile... so, we can just hide the user password in the following way... however it is NOT removed from the DB
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role === 'admin' ? undefined : req.body.role, // This is to prevent the user from signing as admin
    passwordConfirm: req.body.passwordConfirm
  });
  //when I was writing this code, I added secret to the config.env file ...
  //arg1: payload, arg2: secret, arg3: expiration_timer
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; //this is an example of object destructuring
  //1. Check if such email and password exist
  if (!email || !password) {
    return next(new AppError('Please, provide email and password', 400));
  }
  //2. Check if password for such email is correct ... here, because we set {select: false} to the password in userModel, the password will not be accessible by default. Hence, we have to select it manually to check
  const user = await User.findOne({ email }).select('+password');
  //now, we have to check if password is correct... so, we address the model, where checking will take place
  // const passCheckResult = await user.correctPassword(password, user.password);
  //below, instead of passing the passCheckResult, I pass the 'calling function' line of code as we need to check if such user exists, and only then compare passwords... GENIUS
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3. Send token to the client
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
  createSendToken(user, 200, res);
});

//THIS MIDDLEWARE IS TO REMOVE THE COOKIE FROM THE LOCAL STORAGE - we just overwrite the existing cookie with some dummy text and make it expite in 10 seconds
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

// THIS MIDDLEWARE IS TO CHECK WHETHER THE USER IS LOGGED IN OR not - only for rendered pages (no errors) ... because we do not want to catch the errors after the user logs out, we remove the catchAsync function... So, instead of showing an error, it just continued to the next middleware without carrying the user info (hence, showing there is o logged in user)
exports.isLoggedIn = async (req, res, next) => {
  try {
    // console.log(req.cookies);
    if (req.cookies.jwt) {
      //1. verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      //2. Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //3 . Check if the user changed the password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGGED IN USER
      //if there is a logged in user, then the document is created in res.locals. Because every pug document has access to locals, then they may check if the file exists there
      res.locals.user = currentUser;
      // console.log(res.locals.user);
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

//this middleware will be run before the getAllTours function to check if the user is logged in
exports.protect = catchAsync(async (req, res, next) => {
  console.log('User being checked');
  //1. Getting the token and check if it is there.. if it is not in the header, check it in the response (ADDED AFTER RENDERING LOGIN PAGE)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) {
    return next(new AppError('You are not logged in. Please, log in to get access', 401));
  }
  //2. Verification of the token
  //this promisify function will make the function in the argument return a promise... originally, the verify function asynchronously verifies the token and then calls a callback function which is supposed to be passed as a third argument.. instead, we used that promisify function (just Jonas's caprise) ... if error occurs there, it will automatically trigger errorHandling functions... LEARN MORE
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does not exist', 401));
  }
  //4. Check if the user changed the password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('The user changed the password after the token was issued', 401));
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  //it is important to first store the user in the request to make following middlewares have access to the user information
  req.user = currentUser;
  // console.log(res.locals.user);
  res.locals.user = currentUser;
  next();
});

//the following middleware is to restrict certain routes (like admin and user rights)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
//the following middleware is to start the password reset process
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with such email', 404));
  }
  //2. generate random signToken
  const resetToken = user.createPasswordResetToken();
  //we are trying to save the encrypted Token and the Expiration date of that token in the user document... however, because there is validation going, it is hard to do so... hence, we turn of the validation checkup for this case
  await user.save({ validateBeforeSave: false });
  //3. send it back as an email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  // const message = `Forgot your password? Please, reset and confirm it in: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  //we wrap this piece of code into tryCatch block because we do not just want to send an error in case of an error
  try {
    console.log('trying to send email');
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (Valid for 10 min)',
    //   // message: message
    //   message
    // });
    await new Email(user, resetURL).sendPasswordReset();
    //
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(new AppError('There was an error sendind an email. Please, try again later.', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email'
  });
});
//the following middleware is to reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. get user based on the Token ... there params is related to the token that is included into the link
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //here we check if such user exists AND if the token has expired or not
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });
  //2. set a new password (if token has not expired)
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we use SAVE method because we want all the validators and validating middlewares run when the user profile is updated. If we used the method findOneAndUpdate, then it would not validate the incoming data
  await user.save();
  //3. update changedPasswordAt with the user

  //4. log the user in, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
  createSendToken(user, 200, res);
});

//this function updates the password
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. find the current User in DB
  //while I was trying to find out who this user is through the token, jonas just went to the user in request, as we already have the authController.protect function, that will verify the token and add the user object to the request (-_-)
  const user = await User.findById(req.user._id).select('+password');
  //2. check if the posted password is correct ...
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Please, enter your current password correctly', 401));
  }
  //3. update the password with the new one
  // if (req.body.newPassword !== req.body.newPasswordConfirm) {
  //   return next(new AppError('Please, make sure you confirm new password correctly'));
  // }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4. log the user again (provide new JWT)
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
  createSendToken(user, 200, res);
});
