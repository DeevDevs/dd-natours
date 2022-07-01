const mongoose = require('mongoose');
const dotenv = require('dotenv');

// listens to any uncaught exceptions that may occur in the syncronous code (отлавливает все возможные не пойманные исключения/ошибки в синхронном коде)
process.on('uncaughtException', err => {
  process.exit(1);
});

// allows to work with the environment settings (ПО для работы со средой)
dotenv.config({ path: `./config.env` });

// adding the prepared application file and the database
const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connecting to the database (подключаемся к базе данных)
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connections successful'));

//////////////// START SERVER
const port = process.env.PORT || 3000; //
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// listens to any kinds of unhandled rejections that occur in our application in the asynchronous code (отавливает ошибки в асинхронном коде)
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// to politely ask the application to shut down (аккуратно завершает работу приложения)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. SHUTTING DOWN gracefully...');
  server.close(() => {
    console.log('Process terminated!');
  });
});
