//I require mongoose once I install it and then I have to connect it
const mongoose = require('mongoose');

const dotenv = require('dotenv');

//listener below listens to any kinds of uncaught exceptions that occur in our application
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  //we don't need to run server.close() as there are no asyncronous process involved in such kind of errors
  process.exit(1); // 0 stands for success; 1 stands for uncaught exception
});

// after I install the dotenv through npm, I can connect the config file using the code below
dotenv.config({ path: `./config.env` });
//then, we can use the variables assigned through the config.env file in our code... console.log(app.get('env')); // development... console.log(process.env); // many many different things
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//I am adding catch method here to catch unhandled rejection errors
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connections successful'));
// .catch(err => console.log('ERROR'));

//////////////// START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//listener below listens to any kinds of unhandled rejections that occur in our application (in the asynchronous code)
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  //we first run server.close (after we saved server in the variable) to let all the processes finish
  server.close(() => {
    process.exit(1); // 0 stands for success; 1 stands for unhandled rejection
  });
});

// MOVED Code

// //Mongoose schema
// const tourSchema = new mongoose.Schema({
//   //I might just write 'name: String', and it would be find... BUT instead of simply defining the type of data for name, I provide a set of rules
//   name: {
//     //type of data
//     type: String,
//     //if it is required or not, and a string that is shown if the data is not provided
//     required: [true, 'Tour must have a name'],
//     //and here we make sure there are no two tours with the same name
//     unique: true
//   },
//   rating: {
//     type: Number,
//     default: 4.5
//   },
//   price: {
//     type: Number,
//     required: [true, 'Tour must have a price']
//   }
// });

// //Mongoose model ... convention is to call models with capital letter
// const Tour = mongoose.model('Tour', tourSchema);

// //creating a new document based on model... it is an instance of the Tour model (like with classes)
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997
// });

// //and now we try to save it in the database... IT IS SAVED INDEED... wow!!!
// testTour
//   .save()
//   .then(doc => {
//     //the document itself is passed in the resolved promise
//     console.log(doc);
//   })
//   .catch(err => {
//     //or the error, that we can catch
//     console.log('ERROR!!!:', err);
//   });
