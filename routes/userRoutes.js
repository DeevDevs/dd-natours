const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//here I set certains settings for the multer upload processes.. first is where I want to store the uploaded images

const router = express.Router();

// because we cannot logically get or patch signup, we do not build any rountes but just use one operation - post
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// //here, to make user data updates possible, I had to add isLoogedIn here to make user data added to the res
// router.patch('/updateMe', authController.isLoggedIn, userController.updateMe);

//by adding this piece of code below, I make sure that the rest of the routes AFTER it will be protected, while the routes ABOVE are available for non authenticated users... it works because middlewares run in sequence
router.use(authController.protect);

router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

//by this piece of code below, I make sure that the rest of the routes AFTER it can only be accessed by administrators
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
