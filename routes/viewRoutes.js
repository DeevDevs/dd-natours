const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');
const router = express.Router();

//here I am trying to integrate PUG into my server, to make it render webpages
// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Jonas'
//   });
// });

router.get('/me', authController.protect, viewsController.getAccount);

// router.use(authController.isLoggedIn);

router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
