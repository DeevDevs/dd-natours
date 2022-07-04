// brings the model with the tour schema (схему для базы данных с турами)
const Tour = require('./../models/tourModel');
// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('./../utils/catchAsync');
// one of our utils that catches the errors (наша утилита для обработки ошибок)
const AppError = require('./../utils/appError');
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
exports.uploadTourImages = upload.fields([{ name: 'imageCover', maxCount: 1 }, { name: 'images', maxCount: 3 }]);

/**
 *  allow to upload tour cover image and tour images to add a new tour (позволяют загружать изображения для нового тура)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // process cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // giving a unique name
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);
  req.body.imageCover = imageCoverFilename;
  // process other tour images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`; // giving a unique name
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

/**
 *  shows the top tours (показывает топ туры в базе данных)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//functions created on the base of the handlers factory (функции созданные на базе нашей утилиты с универсальными функциями)
exports.getAllTours = factory.getAll(Tour);
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });
exports.addNewTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

/**
 *  retrieve tours' statistics (выводит статистические данные туров)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      //this stage is to identify documents (tours) with certain average rating (основной параметр поиска)
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      //this stage is to group documets (tours) according to certain parameters.. the most important is the _id, because the groups are going to be according to this _id parameter... (тут формируются параметры, по которым будут отображаться результаты поиска, в данном случае основным параметром является сложность)
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numOfTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

/**
 *  retrieves tours according to months (выводит туры относительно дат их проведения)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      //this tool splits a document into several copies of itself (разбивает документы на копии, по необходимости, если параметров несколько)
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numOfTours: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

/**
 *  searches for the tours within certain radius around the target (ищет туры в радиусе)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  //retrieve latitude and longitude (выводим данные о долготе и широте)
  const [lat, lng] = latlng.split(',');
  //count the radians of the distance (рассчитываем расстояние в радианах)
  const radiusInRadians = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Please, provide latitude and longitude in the format lat,lng.', 400));
  }
  //request the tours within the sphere using certain parameters (ищем туры в радиусе)
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radiusInRadians] } } });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

/**
 *  counts distances between the user and the tour (рассчитывает растояние от пользователя до тура)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(new AppError('Please, provide latitude and longitude in the format lat,lng.', 400));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
