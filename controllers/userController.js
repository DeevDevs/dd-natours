// const fs = require('fs');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
//this package is to resize user photos
const sharp = require('sharp');
/////////////////////// STUFF RELATED TO MULTER /////////////////////////////////
const multer = require('multer');
//we need to create a storage and file settings for Multer... the parameters are set manually (see below)
// const multerStorage = multer.diskStorage({
//   //for Storage, we pass destination which is a function that accepts the request, the file that we want to work with, and the callback function that, in turn, accepts an error or null, and apath to a folder in the disk
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   //for File, we have the same parameters... inside, we specify what the name of the file should consist of and the format
//   filename: (req, file, cb) => {
//     //user-userID-timestamp.format
//     const ext = file.mimetype.split('/')[1]; // we retrieve the format from the object with data about the uploaded photo
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// }); // this is absolutely well-working code. However, to make sharp resize the image, we need to keep it in the memoryStorage (RAM), so we add other settings
const multerStorage = multer.memoryStorage();

//and her we need to set multer filter ... it check if the uploaded file is an image or not
const multerFilter = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.startsWith('image')) {
    //if it is an image, then we pass 'TRUE' to the callback, otherwise, we throw an error using our API utils and pass FALSE
    cb(null, true);
  } else cb(new AppError('Not an image. Please, upload images only', 404), false);
};

// const upload = multer({ dest: 'public/img/users' });
//after we have set the multer storage and filter, we can add them to the multer options
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
//below is how we use multer... we add the name of the field where the file is stored... it will also add some info about the file in the request object ... it is stored in req.file
exports.uploadUserPhoto = upload.single('photo');
//////////////////////////////////////////////////////////////////////////
///////////////////////// STUFF RELATED TO IMAGE-RESIZING - SHARP //////////////////////////
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  //because we keep the image in the MEMORY (not the disk), the filename is not assigned in Multer. So, we save the filename manually, os to have access to it in the updateMe middleware below
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //once we store the image in the memory, we can find it in buffer
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//////////////////////////////////////////////////////////////////////////

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async function(req, res, next) {
//   const users = await User.find();
//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: users.length,
//     data: { users: users }
//   });
// });

//this middleware creates the params in request in case the user wants to find himself.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1. create error, if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please, use /updateMyPassword', 400));
  }
  //2. filtered out unwanted field names
  //this method below onle allows data under certain passed keys (name, email)
  const filteredBody = filterObj(req.body, 'name', 'email');
  //and here we add the name of the photo file to update the user photo (we do it AFTER MULTER)
  if (req.file) filteredBody.photo = req.file.filename;

  //3. update user document
  //the option new:true makes it return an updated user object,
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  //1.
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please, user /signup/ instead.'
  });
};

exports.getUser = factory.getOne(User);
//DO NOT update passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
