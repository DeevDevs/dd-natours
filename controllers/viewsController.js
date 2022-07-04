// brings the model with the tour schema (схему для базы данных с турами)
const Tour = require('../models/tourModel');
// brings the model with the booking schema (схему для базы данных с бронированиями)
const Booking = require('../models/bookingModel');
// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('../utils/catchAsync');
// one of our utils that catches the errors (наша утилита для обработки ошибок)
const AppError = require('../utils/appError');

// retrieves the tour data and renders the page (выводит данные тура и рендерит страницу)
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

// retrieves the tour data and renders the page (выводит данные тура и рендерит страницу)
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) return next(new AppError('No tour found on your request', 404));
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

//renders login page (рендерит страницу для входа пользователя)
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: `Log into your account`
  });
};

//renders user profile page (рендерит страницу профиля пользователя)
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
};
//renders the page with all the booked tours (рендерит страницу со всем забронированными турами)
exports.getMyTours = catchAsync(async (req, res, next) => {
  const allBookings = await Booking.find({ user: req.user.id });
  const tourIDs = allBookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// adds alert info to the response object (добавляет уведомление в объект ответа)
exports.alerts = (req, res, next) => {
  const alert = req.query.alert;
  if (alert === 'booking') {
    res.locals.alert =
      'Your booking was successful! Please, check your email. If your booking does not show up here immediately, please come back later.';
  }
  next();
};
