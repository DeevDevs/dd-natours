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

//this middleware is to check if there are any alert message to display to the user... go to viewsController to see
router.use(viewsController.alerts);

router.get('/me', authController.protect, viewsController.getAccount);

// router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

//ONCE WE ADDED THE WEBHOOKCHECKOUT HANDLER, WE DO NOT NEED bookingController.createBookingCheckout..
// router.get('/my-tours', bookingController.createBookingCheckout, authController.protect, viewsController.getMyTours);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
//instead we added route + handler to the app.js

// router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
