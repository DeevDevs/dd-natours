// use model based on the mongoose schema (использует модель на основе mongoose схемы)
const User = require('./../models/userModel');
// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('./../utils/catchAsync');
// one of our utils that catches the errors (наша утилита для обработки ошибок)
const AppError = require('../utils/appError');
// one of our utils with universal functions/handlers (наша утилита с универсальными функциями)
const factory = require('./handlerFactory');
// packages to process uploaded images (пакеты для обработки загружаемых изображений)
const sharp = require('sharp');
const multer = require('multer');
// settings for the multer function to process and store images (настройки multer функции для обработки и созранения изображениц)
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else cb(new AppError('Not an image. Please, upload images only', 404), false);
};
// create a function with settings (создает функцию с настройками)
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

/**
 *  allow to upload profile image (позволяют загружать изображения для профиля)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // assign the filename (подготавливаем уникальное имя для файла)
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //once we store the image in the memory, we can find it in buffer (как только мы сохраняем изображение в памяти, мы находим его в буфере)
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// a supporting function to filter the keys that the user wants to/can update (вспомогательная функция для отфильтровки полей данных, которые нельзя обновить)
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

//this middleware creates the params in request in case the user wants to find himself (ПО которое позволяет пользователю найти свои данные)
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

/**
 *  allow the user to update profile data (позволяют пользователю обновить данные профиля)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please, use /updateMyPassword', 400));
  }
  // filter unwanted fields (отфильтровывает ненужные поля данных)
  const filteredBody = filterObj(req.body, 'name', 'email');
  // add the name of the photo file, if the photo was updated (добавляет название файла, если изображение обновляют)
  if (req.file) filteredBody.photo = req.file.filename;

  // udpate user document and user object (обновляет документ пользователя)
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// makes the user status inactive, hence deleting the user (делает пользователя инактивным, таким образом удаляя его)
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// creates a new user (создает нового пользователя)
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please, use /signup/ instead.'
  });
};

//functions created on the base of the handlers factory (функции созданные на базе нашей утилиты с универсальными функциями)
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
