// маршруты связанные с бронированиями
const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);
// the routes below are only allowed for users who have logged in (маршруты ниже доступны только пользователям-путешественникам)
router.use(authController.protect, authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .delete(bookingController.deleteOneBooking)
  .patch(bookingController.updateBookingDetails)
  .get(bookingController.getOneBooking);

module.exports = router;
