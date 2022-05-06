//we created the tourModel, that exports the tour model, and we need it here... so
// const { lazyrouter } = require('express/lib/application');
// const { get } = require('express/lib/response');
// const { countDocuments } = require('./../models/tourModel');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const sharp = require('sharp');
/////////////////////// STUFF RELATED TO MULTER for uploading tour images /////////////////////////////////
const multer = require('multer');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.startsWith('image')) {
    //if it is an image, then we pass 'TRUE' to the callback, otherwise, we throw an error using our API utils and pass FALSE
    cb(null, true);
  } else cb(new AppError('Not an image. Please, upload images only', 404), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//this is how we set multer to upload
exports.uploadTourImages = upload.fields([{ name: 'imageCover', maxCount: 1 }, { name: 'images', maxCount: 3 }]);
//if there was just one filed, then we would have to use `upload.array('images', 5)`
///////////////////////////////////////////////////////////////////////

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files); // in case of upload.array and upload.fields, the end object in the request is req.FILES, while upload.single creates the req.FILE object
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover Image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);
  // now, because the updateOne middleware accepts the model and then updates data according to the req.body, we have to add this infor to the req.body
  req.body.imageCover = imageCoverFilename;
  //2. Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  // console.log(req.body);
  next();
});

// Middleware to show top Tours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // FIRST BUILD A QUERY (which is moved to APIFeatures)

//   // THEN EXECUTE THE QUERY\
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   //here we finally resolve the query after all the methods applied... we eventually USE it
//   const tours = await features.query;
//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: { tours: tours }
//   });
// });

exports.getOneTour = factory.getOne(Tour, { path: 'reviews' } /*or just placing 'reviews' would be enough*/);
// exports.getOneTour = catchAsync(async (req, res, next) => {
//   //after we added referencing to the TourSchema, we need to make the referenced documents to be added/shown in the requested tour.. so, we add a method called populate, to do that on query.. it replaces the IDs with actual data.. we can also chooose certain information that we DO NOT want to populate the requested tour with....
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   //this is how we choose the categories/parameters that we do not want (using MINUS sign)
//   //   select: '-__v -passwordChangedAt'
//   // });
//   //however, if we want all tours to have the same populating feature, we can create a middleware instead
//   const tour = await Tour.findById(req.params.id).populate('reviews'); //the last populate method is to display reviews as well
//   //Tour.findOne({_id: req.params.id}) <-- this is another way to find object in the database using the id

//   //this is an error handling piece of code that catches the error with empty ID and throws an error
//   if (!tour) {
//     // return next(new AppError('No tour found with that ID', 404));
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     tour
//   });
// });

//MOVED TO AN EXTERNAL MODULE FILE
// //this function below is used to catch async function errors and is used in the functions below... whenever there is a request, it goes to the handler function, and and the handler runs the catchAsync first. Because catchAsync has a  ... COMPLICATED
// const catchAsync = fn => {
//   return (req, res, next) => {
//     // fn(req, res, next).catch(err => next(err));
//     fn(req, res, next).catch(next);
//   };
// };

exports.addNewTour = factory.createOne(Tour);
// exports.addNewTour = catchAsync(async (req, res, next) => {
//   // const newTour = new Tour({})
//   // newTour.save()
//   //instead of using the familiar code above to first create a model from schema and then saving it, we can do the folowing
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //this option makes the method return the new/updated document/data
//     new: true,
//     //this option enables validators set in the schema to validate the updates
//     runValidators: true
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     deletedTour: {
//       tour
//     }
//   });
// });

//it can manipulate data in the query to make certain counting, etc.
exports.getTourStats = catchAsync(async (req, res, next) => {
  //we define certains stages inside this aggregate method (that comes from mongoDB)
  const stats = await Tour.aggregate([
    {
      //this stage is to identify documents (tours) with certain average rating
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      //this stage is to group documets (tours) according to certain parameters.. the most important is the _id, because the groups are going to be according to this _id parameter... e.g. if I group according to difficulty level, then all 'easy' tours will have this statistics aggregated, then all 'medium', etc.
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
      //now, in order to address certain features of the Tours, I can no longer use the initial key/value pairs, because they were renamed and re-organized in the previous stage. Instead, I have to use those created in the previous stage
      $sort: { avgPrice: 1 }
    }
    // {
    //   //I can repeat stages... for example here I make the API show only those tours that are NOT EQUAL to easy
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      //this tool splits a document into several copies of itself, if the target key has several values stored in the array... for every element of the array one copy
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
      //adds a new field/fields to the documents
      $addFields: {
        month: '$_id'
      }
    },
    {
      //helps identify, which of the fields should/shouldn't be displayed (0 - hide , 1 - display)
      $project: {
        _id: 0
      }
    },
    {
      //it helps to sort the documents by the number of tours... here it is descending (from the busiest month to the least busy)
      $sort: { numOfTours: -1 }
      // $sort: { month: 1 }
    },
    {
      //determines the maximum number of documents allowed to be displayed/sent
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

// FUNCTION FOR GEOSPATIAL FEATURES OF THE APP
// '/tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/200/center/25.309379,55.285726/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  //retrieve latitude and longitude
  const [lat, lng] = latlng.split(',');
  //to count the radians of the distance, we need to divide our given distance by the radius of the Earth. Here, if we have miles, then radius is in miles... and with kilometers values are different
  const radiusInRadians = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  //throw error, if some data is not provided
  if (!lat || !lng) {
    next(new AppError('Please, provide latitude and longitude in the format lat,lng.', 400));
  }
  //request the tours within the sphere using certain parameters
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radiusInRadians] } } });
  // console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  //throw error, if some data is not provided
  if (!lat || !lng) {
    next(new AppError('Please, provide latitude and longitude in the format lat,lng.', 400));
  }

  //to make $geoNear work, you should provide indexes on geoSpatial data in the collection. If you have multiple geoSpatial-data-related indexes, you have to specify, which one should this parameter refer to. Also, this parameter MUST be the first one in the aggregation pipeline
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //it shows where the counting of distances begins
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        //it shows where the data is stored
        distanceField: 'distance',
        //it allows to do math operations with the value stored in 'distance'
        distanceMultiplier: multiplier
      }
    },
    //this project stage is to make only certain values to be displayed
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

/////////////////// HERE I STORE OLD METHODS USED BEFORE REFACTORING

// exports.getAllTours = async (req, res) => {
//   try {
//     // FIRST BUILD A QUERY

//     // 1A. Filtering
//     //first, let us create a shallow copy of the req.query object (here he uses destructuring... WOW)
//     const queryObj = { ...req.query };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     //now, these fields are deleted from the query object
//     excludedFields.forEach(el => delete queryObj[el]);
//     console.log(req.query, queryObj); // { duration: '5', difficulty: 'easy', sort: '1', limit: '10' } { duration: '5', difficulty: 'easy' }
//     // console.log(req.query); // req.query has the query parameters { duration: '7', difficulty: 'easy' }

//     // 1B. Advanced Filtering
//     let queryStr = JSON.stringify(queryObj);
//     //first argument is a RegExp, where | = OR, \b = exact instances, g = all the instances... second argument is the callback function that is run for every match, and I ask every match to have dollar sign + match
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//     console.log(JSON.parse(queryStr));
//     //here we store the unresolved yet query in order to be able to apply bunch of methods... (after it resolves, we cannot implement them)
//     let query = Tour.find(JSON.parse(queryStr)); // one way to implement filtering is through find
//     //OR the second way
//     // const query = Tour.find()
//     //   .where('duration')
//     //   .equals(5)
//     //   .where('difficulty')
//     //   .equals('easy');
//     // 2. Sorting
//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(',').join(' ');
//       // it accepts the parameters as a string with space. e.g. sort('price ratingsAverage'), so we first splitted our sorting-related query string and replaced the comma
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-createdAt'); // the newest will appear first
//     }

//     // 3. Field limiting
//     if (req.query.fields) {
//       const fields = req.query.fields.split(',').join(' ');
//       console.log(fields);
//       query.select(fields);
//     } else {
//       query = query.select('-__v');
//     }

//     // 4. Pagination
//     const page = req.query.page * 1 || 1; // given page or page 1
//     const limit = req.query.limit * 1 || 100;
//     const skip = (page - 1) * limit;
//     //page=2&limit=10
//     query = query.skip(skip).limit(limit);
//     // in case the client asks for the page that does not exist
//     if (req.query.page) {
//       const numOfTours = await Tour.countDocuments();
//       if (skip >= numOfTours) throw new Error('This page does not exist');
//     }
//     // THEN EXECUTE THE QUERY
//     //here we finally resolve the query after all the methods applied... we eventually USE it
//     const tours = await query;
//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       requestedAt: req.requestTime,
//       results: tours.length,
//       data: { tours: tours }
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'Fail',
//       message: err.message
//     });
//   }
// };

// exports.getOneTour = async (req, res) => {
//   try {
//     const tour = await Tour.findById(req.params.id);
//     //Tour.findOne({_id: req.params.id}) <-- this is another way to find object in the database using the id
//     res.status(200).json({
//       status: 'success',
//       tour
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'Error',
//       message: err
//     });
//   }
// };

// exports.addNewTour = async (req, res) => {
//   try {
//     // const newTour = new Tour({})
//     // newTour.save()
//     //instead of using the familiar code above to first create a model from schema and then saving it, we can do the folowing
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'Fail',
//       message: 'Invalid data set'
//     });
//   }
// };

// exports.updateTour = async (req, res) => {
//   try {
//     //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       //this option makes the method return the new/updated document/data
//       new: true,
//       //this option enables validators set in the schema to validate the updates
//       runValidators: true
//     });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'Fail',
//       message: err
//     });
//   }
// };

// exports.deleteTour = async (req, res) => {
//   try {
//     //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'success',
//       deletedTour: {
//         tour
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'Fail',
//       message: err
//     });
//   }
// };

/////////////////// HERE I STORE OLD METHODS USED FOR TESTING

// const fs = require('fs');
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// //it checks if the data sent through the request is valid
// exports.checkBody = (req, res, next) => {
//   console.log(req.body.name, req.body.price);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({ status: 'fail', message: 'Missing name or price' });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   //here I use certain JSON formatting when sending the data in response... it should have a status and the data... look how data has the same name as the word in the URL... it will make the API more logical after all
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: { tours: tours }
//   });
// };

// exports.getOneTour = (req, res) => {
//   // //the URL can have multiple parameters, like "/api/v1/tours/:id/:x/:y" ... also, the parameters can be optional, like "/api/v1/tours/:id/:x/:y?" ... if so, then there will be no error in case the last parameter is does not appear in the request url, the variable assigned to it will be undefined
//   // console.log(req.params); // { id: '5' } if we request with :id = 5

//   const id = req.params.id * 1; // this is a trick to turn a string with the number into a number
//   // // if (id > tours.length) {
//   // //   return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   // // }

//   const tour = tours.find(el => el.id === id);
//   // if (!tour) {
//   //   return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   // }

//   res.status(200).json({
//     status: 'success',
//     tour
//   });
// };

// exports.addNewTour = (req, res) => {
//   const newID = tours[tours.length - 1].id + 1;
//   //prettier-ignore
//   const newTour = Object.assign({id: newID}, req.body);
//   console.log(newTour);

//   tours.push(newTour);
//   //we have to save the data in the file... overwrite the file
//   fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
//     //status 201 means 'created'
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
//   });
// };

// exports.updateTour = (req, res) => {
//   // //here we check if the tour with such id exists
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   // }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: 'Updated Tour Here...'
//     }
//   });
// };

// exports.deleteTour = (req, res) => {
//   // //here we check if the tour with such id exists
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   // }

//   //204 status means 'no content' because we delete data and do not send any data back
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// };
