// const fs = require('fs');
//this PATH is a built in core module in express that allows us to work with paths
const path = require('path');

const express = require('express');
//I installed morgan using 'npm i morgan' and saved it here
const morgan = require('morgan');
//this is a rate limiting dependency that allows to keep track of the number of requests
const rateLimit = require('express-rate-limit');
//this is for security HTTP headers
const helmet = require('helmet');
//this is for Data sanitization
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
//this is to avoid parameter pollution
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
//for GZIP
const compression = require('compression');
//for CORS - it is another middleware function
const cors = require('cors');
// const res = require('express/lib/response');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
// we run the app by triggering the express package as function
//Start the App
const app = express();

app.enable('trust proxy'); // through this setting we allow createSendToken function in authController check the secureity of the connection

//this line below tells express what kind of engine we will use for creating webpage templates... to make this code work we might need to install PUG module (npm i pug)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // here, node will create proper path for viewsv

//and here is how we can address static files (e.g. html files) ... it SERVES STATIC FILES
// app.use(express.static(`${__dirname}/public`)); // OLD way of building paths
app.use(express.static(path.join(__dirname, 'public'))); // supported way of building paths
//however, we do not need to mention this 'public' word in the URL, we can go directly through 127.0.0.1:3000/overview.html to reach that static file

//////////////// GLOBAL MIDDLEWARES /////////////////////////////
//this one is for COR - IMPLEMENT CORS - ACCESS CONTROL ALLOW ORIGIN for everyone
app.use(cors()); //if we want to allow it everywhere, we add it here. If we want to allow CORS only on specific route, we should go to that router, and add it there in the req,res cycle
//in case we want our api to be allowed to access only from one domain(e.g. front-end is www.natours.com), then we would write it this way
// app.use(cors({
//   origin: 'https://www.natours.com'
// }));
//this is for the options request that occurs at the pre-flight phase
app.options('*', cors()); // this way we allow even complex requests on all routes
// if we want to restrict it, then we can e.g. make it like this
// app.options('/api/v1/tours/:id', cors()); // then it is the only path that is allowed to have pre-flight phase

//this is a middleware that is used to SET SECURITY HTTP HEADERS... it is an unusual function, that creates parameters that will later be set inside the use method... it is a good practice to run this middleware early to make sure headers have all the necessary parameters set
app.use(helmet());

//here, we can use the variable from our environment configurations to make the morgan middleware work only when it is in development
// console.log(process.env.NODE_ENV);

// DEVELOPMENT ENVIRONMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  //here we add morgan to the middleware and it provides some info about the requests and prints them to the console... for example 'GET /api/v1/tours 200 2.482 ms - 8744'
  app.use(morgan('dev'));
}

//this is middleware... it is between the request and response and is used to modify the data... for example here it automatically retrieves js object/s from the json it receives in requests ... BODY PARSER, READING DATA FROM BODY INTO REQ.BODY ... the options inside are used to limit the amount of data.. so, if the request body is more than 10 kb, it will not be accepted
app.use(express.json({ limit: '10kb' }));
//this is to retrieve cookies from requests
app.use(cookieParser());

//this middleware here is to PROCESS DATA FROM THE SUBMITTED FORM... it kinda makes the encoded data available
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// DATA SANITIZATION AGAINST NoSQL QUERY INJECTION it is similar to helmet and creates parameters that can then be used by express
app.use(mongoSanitize());
// DATA SANITIZATION AGAINST XSS it prevents user from inserting some malicious http+js code
app.use(xss());
// PARAMETER POLLUTION preventing middleware ... if there are multiple instances of one parameter in a request, then api will only consider the last instance... however, there is a room for whitelist, in case we allow some parameters to appear miltiple times.. so, if I want no whitelist, I simply remove that options object
app.use(
  hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
  })
);

//we use the 'use' method to add function to our middleware stack... it is run during every request/response cycle because it is at the top of the page and is defined before all the routes etc... However, if I place it after some route, then that particular route won't have this middleware included
// app.use((req, res, next) => {
//   console.log('Hello from the Middleware');
//   next();
// });

//this middleware is keeping track of requests ... LIMITING REQUESTS
const limiter = rateLimit({
  //it is for the number of requests
  max: 100,
  //it is a time frame for the limit of requests
  windowMs: 60 * 60 * 1000,
  //it is a message to send if the limit is exceeded
  message: 'Too many requests from this IP, please try again in 1 hour!'
});
//here, we only address the routes that start with '/ api'
app.use('/api', limiter);

//here I add compression to the app to make it compress TEXT requests/responses
app.use(compression());

//Here, I make every request object have a new key/value parameter with the current time ... TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //requests can carry certain headers with them
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

// //here I am trying to integrate PUG into my server, to make it render webpages
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Jonas'
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours'
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour'
//   });
// });
//and if I want to pass some data, I have to add the data as a second parameter

///////////////// MOUNT ROUTES
//if you look at the syntax, these two lines of code remind middlewares... they are actually middlewares
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//we built a middleware below to catch those requests that were not responded to in previous routes
//this is how we can address all kinds of requests (app.all) through all kinds of URLs ('*')
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'Fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//error handling middleware ... I have moved it to an external module in controllers/errorController
app.use(
  //   (err, req, res, next) => {
  //   console.log(err.stack);
  //   err.statusCode = err.statusCode || 500;
  //   err.status = err.status || 'error';
  //   res.status(err.statusCode).json({
  //     status: err.status,
  //     message: err.message
  //   });
  // }
  globalErrorHandler
);

module.exports = app;

//Here we add the get request to the app, which includes the link (in this case it is the root) and the callback function, like in the http requests ... this get method sends the response to the client once it receives the request on a specific address
// app.get('/', (req, res) => {
//   //   //this function sends a string back to the client
//   //   res.status(200).send('Hello from the server side!');
//   //this function sends a json to the client
//   res.status(200).json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

//////////////// ROUTE HANDLERS

///////// here we keep callback function outside the loop to make loop look more accurate
// const getAllTours = (req, res) => {
//   //here I use certain JSON formatting when sending the data in response... it should have a status and the data... look how data has the same name as the word in the URL... it will make the API more logical after all
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     requestedAt: req.requestTime,
//     data: { tours: tours },
//   });
// };

// const getOneTour = (req, res) => {
//   //the URL can have multiple parameters, like "/api/v1/tours/:id/:x/:y" ... also, the parameters can be optional, like "/api/v1/tours/:id/:x/:y?" ... if so, then there will be no error in case the last parameter is does not appear in the request url, the variable assigned to it will be undefined
//   console.log(req.params); // { id: '5' } if we request with :id = 5

//   const id = req.params.id * 1; // this is a trick to turn a string with the number into a number
//   // if (id > tours.length) {
//   //   return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   // }

//   const tour = tours.find((el) => el.id === id);
//   if (!tour) {
//     return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   }

//   res.status(200).json({
//     status: 'success',
//     tour,
//   });
// };

// const addNewTour = (req, res) => {
//   const newID = tours[tours.length - 1].id + 1;
//   //prettier-ignore
//   const newTour = Object.assign({id: newID}, req.body);
//   console.log(newTour);

//   tours.push(newTour);
//   //we have to save the data in the file... overwrite the file
//   fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
//     //status 201 means 'created'
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   });
// };

// const updateTour = (req, res) => {
//   //here we check if the tour with such id exists
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: 'Updated Tour Here...',
//     },
//   });
// };

// const deleteTour = (req, res) => {
//   //here we check if the tour with such id exists
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'invalid ID' });
//   }

//   //204 status means 'no content' because we delete data and do not send any data back
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route is not yet defined',
//   });
// };

// const createUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route is not yet defined',
//   });
// };

// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route is not yet defined',
//   });
// };

// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route is not yet defined',
//   });
// };

// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this route is not yet defined',
//   });
// };

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

//this is to listen to the get request from the client to get all the tours
// app.get('/api/v1/tours', getAllTours);
//this is to listen to the get request from the client to get just one tour... by adding the column, we specify the assign the variable name to anything that is added to the URL at the end
// app.get('/api/v1/tours/:id', getOneTour);
//this is to listen to the post request from the client
// app.post('/api/v1/tours', addNewTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//////////////// ROUTES

//we need to create a routers for different sources... for example here we will create one for the tours, and the other one for users... below we create a middleware. It is a kind of 'sub application' where the middleware called 'tourRouter' is tied to the URL and the callback functions ... we are mounting routers here
// const tourRouter = express.Router();
// const userRouter = express.Router();
// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// instead of assigning them separately, we can unite them if they have the same URL, for example here we have get and post together in one line of code ... look at the commented code above
// tourRouter.route('/').get(getAllTours).post(addNewTour);
// tourRouter.route('/:id').get(getOneTour).patch(updateTour).delete(deleteTour);
//and these are routes for users
// userRouter.route('/').get(getAllUsers).post(createUser);
// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
// //////////////// START SERVER
// const port = 3000;
// //then we add listener to this app with the port and a callback function
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });
