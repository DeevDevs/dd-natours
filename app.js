const express = require('express');
// a built in core module in express that allows us to work with paths (встроенный в экспресс модуль, позволяющий работать с путями к файлам)
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
// our middlewareы that processes errors (наше промежуточное ПО, которое обрабатывает ошибки)
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
// routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

//Start the App
const app = express();

app.enable('trust proxy'); // through this setting we allow createSendToken function in authController check the security of the connection
// pages are createdd using PUG templates (страницы создаются с помощью PUG шаблонов)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// this middleware presets the path to static files for easy access (это ПО настраивает доступ к статичным файлам для большего удобства)
app.use(express.static(path.join(__dirname, 'public')));
// middleware that allows requests from third party domains (позволяет обрабатывать запросы со сторонних доменов)
app.use(cors());
app.options('*', cors());
// the middleware creates/supports security HTTP headers (это промежуточное ПО создает/поддерживает безопасные заголовки HTTP)
app.use(helmet());
// this middleware is for development purposes that logs requests info (это промежуточное ПО помогает в работе разработчика, предоставляя данные о запросах)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// integrated middleware here makes sure the data from the stripe request is in the raw format, therefore it is placed before json middleware (встроенное ПО здесь отправляет запрос с Stripe в сыром формате для обработки в дальнейшем. Так, json ПО не изменяет формат, поэтому данный маршрут  находится здесь)
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout);
// it converts json files into js objects for future use (конфертирует json данные в объекты)
app.use(express.json({ limit: '10kb' }));
// allows to work with cookies (выводит cookie-данные и позволяет работать с ними)
app.use(cookieParser());
// allows encoded data from the submitted forms to be accessible (разрещает доступ к данным из отправленных форм)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// protects data against query injections (защищает запросы от внедрения вредоносных ПО)
app.use(mongoSanitize());
// protects application against malicious http+js code (защищает от возможного вредоносного http/js кода)
app.use(xss());
// protects from parameter pollution (защищает от ошибок связанных с параметрами запроса)
app.use(hpp({ whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'] }));
// this is a rate limiting middleware that allows to keep track of the number of requests (это промежуточное ПО отслеживает количество запросов с IP, и ограничивает их, при необходимости)
const limiter = rateLimit({
  max: 100, //it is for the number of requests
  windowMs: 60 * 60 * 1000, //it is a time frame for the limit of requests
  message: 'Too many requests from this IP, please try again in 1 hour!'
});
// we only implement limiter to the API (ограничивает только запросы в адрес API)
app.use('/api', limiter);
// middleware that does the GZIP archivation (добавляет архивацию GZIP)
app.use(compression());

// mounting routes (накладывают маршруты)
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// if the route is missing, creates an error for the future handler (если маршрут отсутствует, создается ошибка)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
//error handling middleware (ПО которое отлавливает ошибки)
app.use(globalErrorHandler);

module.exports = app;
