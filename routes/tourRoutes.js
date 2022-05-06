const express = require('express');
// const res = require('express/lib/response');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//param Middleware is run only when there is a parameter in the URL ... as always, it has those three parameters, PLUS the value of the parameter (see below)
// router.param('id', (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   next();
// });
//Now, we use the function that we keep in the tourController to check the validity of ID
// router.param('id', tourController.checkID);

//look at the first line... here we added two functions to be run once post request is made... we can order then using comma and they will be executed one after another
// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(tourController.checkBody, tourController.addNewTour);
// router
//   .route('/:id')
//   .get(tourController.getOneTour)
//   .patch(tourController.updateTour)
//   .delete(tourController.deleteTour);

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.addNewTour);
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

// this is a simple nexted post route to create REVIEWS... it works well, but we will use MergeParams method and kind of re-send this request to the reviewRouter
// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);
router.use('/:tourId/reviews', reviewRouter); // here we are mounting the router (like in the app.js)... so, it will redirect the request to the reviewRoutes and there it will trigger the GET request/response cycle ..

module.exports = router;
