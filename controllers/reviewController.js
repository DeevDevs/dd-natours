// brings the model with the review schema (схему для базы данных с отзывами)
const Review = require('./../models/reviewModel');
// one of our utils with universal functions/handlers (наша утилита с универсальными функциями)
const factory = require('./handlerFactory');

// it retrieves the IDs of the tour and the user in case any of these is missing (выводит ID тура или пользователя при необходимости)
exports.setTourUsersIds = (req, res, next) => {
  // in case of the nested routes it tries to elicit the tour ID from the params (в случае с вложенным маршрутом, пытаетя вывести ID тура из параметров)
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if there is no user in the body, retrieves from the user object in the request (а если нет информации о пользователе, выводит данный из объекта в запросе)
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//functions created on the base of the handlers factory (функции созданные на базе нашей утилиты с универсальными функциями)
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
