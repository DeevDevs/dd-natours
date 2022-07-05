// маршруты связанные с веб-страницами и рендерингом
const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');
const router = express.Router();

// check if there are any alert message to display to the user (проверяет, нужно ли выводить уведомления для пользователя)
router.use(viewsController.alerts);

router.get('/me', authController.protect, viewsController.getAccount);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

router.get('/my-tours', authController.protect, viewsController.getMyTours);

module.exports = router;
