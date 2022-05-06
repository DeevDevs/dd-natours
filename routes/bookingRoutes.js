const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);

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
// router.patch('/:id', bookingController.updateBookingDetails);
// router.post('/', bookingController.createBooking);
// router.get('/:id', bookingController.getOneBooking);

module.exports = router;
