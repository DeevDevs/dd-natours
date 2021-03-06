const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config({ path: `./config.env` });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connections successful'));

//Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'UTF-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'UTF-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'UTF-8'));

//import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//delete old data
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData(); //it imports data from the data files in the dev-data
} else if (process.argv[2] === '--delete') {
  deleteData(); //it deletes all the data in the database
}
