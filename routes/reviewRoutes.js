const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// here we add the mergeParams as TRUE to make these parameters accessible if we transfer the request from one router to another... as far as I understand, if one router receives params in the URL and then transfers the request to another router, it can also transfer the params.. and these parameters are no accessible by default here because our router in the reviewRoutes does not have specified params in the URL (see '/')... here we fix it
const router = express.Router({ mergeParams: true });

//this line of code makes sure that no routes are accessible by non-authenticated users
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'), reviewController.setTourUsersIds, reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
