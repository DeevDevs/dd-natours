const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
// const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   //so, if the request has no tourID, then all the reviews will be sent in response. BUT if there is a tourID, then only reviews of that tour will be filtered out.
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: reviews.length,
//     data: { reviews: reviews }
//   });
// });

//we had the createReview function working, but then we decided to replace it using factory functions. But we have extra piece of code here related to the setting of the UserID. So, we added one small middleware that will be run along with the fatory function ... see below
// exports.createReview = catchAsync(async (req, res, next) => {
//   //we update the function when we build nested routes. Here, I try to elicit the tour ID from the params in the URL
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   //and in case there is no user in the body, we address the user that we save in the request when the protect middleware from authController is run
//   if (!req.body.user) req.body.user = req.user.id;

//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview
//     }
//   });
// });
exports.setTourUsersIds = (req, res, next) => {
  //we update the function when we build nested routes. Here, I try to elicit the tour ID from the params in the URL
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //and in case there is no user in the body, we address the user that we save in the request when the protect middleware from authController is run
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
