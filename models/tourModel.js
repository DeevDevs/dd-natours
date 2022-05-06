//I require mongoose once I install it and then I have to connect it
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');
//Mongoose schema
const tourSchema = new mongoose.Schema(
  {
    //I might just write 'name: String', and it would be find... BUT instead of simply defining the type of data for name, I provide a set of rules
    name: {
      //type of data
      type: String,
      //if it is required or not, and a string that is shown if the data is not provided
      required: [true, 'Tour must have a name'],
      //and here we make sure there are no two tours with the same name
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have 40 characters maximum'],
      minlength: [10, 'Tour name must have 10 characters minimum']
      //this is an external validator from the outsource
      // validate: [validator.isAlpha, 'Tour name must have letters only']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Tour must have duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have group size']
    },
    difficulty: {
      type: String,
      required: [true, 'Tour must have group difficulty'],
      //this validator means that only listed entries are allowed
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'Difficulty is either easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //this parameter below makes the rating value rounded to 1 decimal only
      set: val => Math.round(val * 10) / 10 // 4.666 * 10 = 46.66 --> rounded to 47 --> 47/10 = 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price']
    },
    priceDiscount: {
      type: Number,
      //this is a custom validator. It has input as the argument, and it can have access to this (the whole object)
      validate: {
        validator: function(val) {
          //THIS has access to the document only when NEW document is created
          return val < this.price;
        },
        //look, how we can access the entered value in mongoose use curly braces inside the regular string
        message: 'Discount price ({VALUE}) must be lower than the Regular price'
      }
    },
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Tour must have description'],
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have cover image']
    },
    //when I claim - [String] - I specify that I want to have string in an array
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false //this way we exclude the parameter from being sent to the client (use for sensitive data)
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      // GeoJSON is a special format for geospatial data ... in this case, the entire object is supposed to be recognized. We can make it by creating type and coordinates parameters (they are a must)... the rest parameters are optional
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      // this [Number] means that we expect the array of numbers
      coordinates: [Number],
      address: String,
      description: String
    },
    // to create embedded documents, we add an extra level in the object (objects inside an array)
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array // this was the parameter used for EMBEDDING
    // below is how REFERENCING happens
    guides: [
      {
        type: mongoose.Schema.ObjectId, //this is a special type that is applicable for Mongoose
        ref: 'User' //this is how we establish references between different datasets in Mongoose
      }
    ]
  },
  //these are the options of the schema... I want virtuals to be shown when documents are requested... virtuals are a kind of data elements, that are created in the middle of some functions because they can be calculated... however, they are not stored in the DB
  { toJSON: { virtuals: true }, toObjects: { virtuals: true } }
);

//the following middleware is to create indexes on certain fields in the schema... the value 1 means they will be sorted in ascending order (-1 - descending)
// tourSchema.index({ price: 1 }); //this is a singIndex
tourSchema.index({ price: 1, ratingsAverage: -1 }); // this is compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// schema can also have virtual properties. They are the properties we can define and display, but we do not need to store them in the database as they can be retrieved from the other schema parameters. This is how virutals are created... we cannot refer to this data in methods
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//this is an example of Virtual Populate middleware
tourSchema.virtual('reviews', {
  ref: 'Review',
  //foreignField is the place in the target model (the model from where we are going to get data), where the reference to this tourModel is kept... thus the tourModel will seek for the tour section in reviews to find which of these reviews are actually about the tour
  foreignField: 'tour',
  //as it is going to use IDs to find out which review it needs, it will have to use own ID, so, in localField with mention, which field it is going to use to find match
  localField: '_id'
});
//after we draw a path to another model, we need to run the populate method, and we do it in GetOneTour in tourController

// DOCUMENT MIDDLEWARE - these middlewares can be run before an after the document is created/saved
//this function is going to be run before .save() and .create() are called
tourSchema.pre('save', function(next) {
  //I installed slugify (npm i slugify), and now add a property to the document... I also added 'slug' to the schema... otherwise it would never appear in the document... here THIS points to the documents one by one
  this.slug = slugify(this.name, { lower: true });
  next();
});

////////////////////////////////////////////////////////////////
//EMBEDDING GUIDES - another middleware that we created after we added 'guides' to the TourSchema. Behind the scenes, it adds user (guides and lead/guides) documents to the Tour documents once we create it. This middleware is run before the tour is saved. Unfortunately, it does not fit our data modelling plan, so we exclude it from the code.
// tourSchema.pre('save', async function(next) {
//   //here we loop over the array and replace each id with the user document... however, as it is MAP method, the array will have a list of promises that we have to await, resolve and only then replace list of IDs with list of Guides
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// ... instead, we go for referencing
/////////////////////////////////////////////////////////////////

// tourSchema.pre('save', function(next) {
//   console.log('Will save the document...');
//   next();
// });

// //this function is going to be run after .save() and .create() are called
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE - these middlewares are run before and after the query is done (for example, before and after the query.find())
// instead of using it only for the find method (tourSchema.pre('find', function(next) {}), we us RegExp to make it work for any method that start with the word find ... so, findOne is also included
tourSchema.pre(/^find/, function(next) {
  // It goes through the documents and excludes all that are secret
  // here THIS points to the found documents
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// this middleware populates tours with the content from referenced collections, DB
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// AGGREGATION MIDDLEWARE - these middlewares are run before and after the aggregation process is executed
// tourSchema.pre('aggregate', function(next) {
//   // here THIS points to the object with pipeline method
//   // console.log(this.pipeline());
//   //so, to add another stage to the aggregation, we will now specify another stage right in this object
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // console.log(this.pipeline());
//   next();
// }); we removed this piece of code as it is unnecessary. Also, it did not let out geospatial aggregation pipeline work

//it has access to all the docs that we have got as a result of query
tourSchema.post(/^find/, function(docs, next) {
  // here THIS also points to the found documents
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//Mongoose model ... convention is to call models with capital letter
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
