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
    //if you pass in one object/json string, then it will create one document ... if you pass in an array, then it will create a separate document for every element in that array
    // console.log(tours);
    await Tour.create(tours);
    //whenever we create a new user, he should confirm his password. otherwise data won't be saved. however, to import data, we do not need to validate it (in our case). So, we can turn off the validation... we also have to turn off the middlewares that encrypt the password (because imported database already has encrypted passwords)
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    // console.log('Data successfully loaded');
  } catch (error) {
    console.log(error);
  }
  //if I leave it just like this... then after the data is deleted, the process will still be running... so, I need to end the process
  process.exit();
};

//delete old data
const deleteData = async () => {
  try {
    //if you pass nothing to this function, then it will delete all the documents...
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    // console.log('Data successfully deleted');
  } catch (error) {
    console.log(error);
  }
  //if I leave it just like this... then after the data is deleted, the process will still be running... so, I need to end the process
  process.exit();
};

// executing --> node dev-data/data/importDevData.js --import
//this method displays the location of node.exe, that executes the code, and the path to the code file itself
// console.log(process.argv); // ['C:\\Program Files\\nodejs\\node.exe', 'D:\\My Web\\complete-node-bootcamp-master\\4-natours\\starter\\dev-data\\data\\importDevData.js', --import]

//So, if the third argument is --import, then the data is imported... I can also make that argument --delete, then the data will be deleted
if (process.argv[2] === '--import') {
  importData(); //it imports data from the data files in the dev-data
} else if (process.argv[2] === '--delete') {
  deleteData(); //it deletes all the data in the database
}
