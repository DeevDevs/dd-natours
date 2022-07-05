// маршруты связанные с отзывами
const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// here we add the mergeParams as TRUE to make these parameters accessible if we transfer the request from one router to another (позволяет передавать параметры запроса на другие маршруты)
const router = express.Router({ mergeParams: true });

// makes sure that no routes are accessible by non-authenticated users (защищает маршруты от неавторизованного входа)
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
