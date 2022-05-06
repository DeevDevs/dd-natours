const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const Review = require('../models/reviewModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. get the tour data from our collection
  const tours = await Tour.find();

  //2. build a template
  //3. render that template using the data

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the data for the requested tour
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) return next(new AppError('No tour found on your request', 404));

  //2. render that template using the data
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: `Log into your account`
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. find all bookings
  const allBookings = await Booking.find({ user: req.user.id });

  // 2. find tours
  const tourIDs = allBookings.map(el => el.tour);
  //this is how we can find tours according to IDs in the array. The options below will try to 'find all the tours whose IDs are in the tourIDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// FIRST IT WAS USED FOR THE USER UPDATE THROUGH FRONT END (WITHOUT API) BUT THEN IT WAS MOVED TO THE API
// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     {
//       // it means that we want the updated user data after it is updated
//       new: true,
//       //and we want the changes to be checked before they are made
//       validators: true
//     }
//   );
//   //now we just want to reload the page with the account details
//   res.status(200).render('account', {
//     title: 'My Account',
//     //however, after the changes in the user data, the user data that is passed through requests is outdated. So, it is IMPORTANT to pass new user details
//     user: updatedUser
//   });
// });

exports.alerts = (req, res, next) => {
  const alert = req.query.alert;
  if (alert === 'booking') {
    res.locals.alert =
      'Your booking was successful! Please, check your email. If your booking does not show up here immediately, please come back later.';
  }
  next();
};
