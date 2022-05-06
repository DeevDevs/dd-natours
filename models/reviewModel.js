const mongoose = require('mongoose');
const Tour = require('./tourModel');
// review, rating, createdAt, ref user, ref tour

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review must have a text description'],
      maxLength: [500, 'Your review should not contain more than 500 characters']
      //   minLength: [25, 'Your review should not contain less that 25 characters']
    },
    rating: {
      type: Number,
      required: true,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    tour: [{ type: mongoose.Schema.ObjectId, ref: 'Tour', required: [true, 'Review must belong to a tour!'] }],
    user: [{ type: mongoose.Schema.ObjectId, ref: 'User', required: [true, 'Review must belong to a user!'] }]
  },
  { toJSON: { virtuals: true }, toObjects: { virtuals: true } }
);

//this middleware prevents multiple reviews of one user on the same tour... we create an object with options.. this unique parameter check if the COMBINATION of user+tour is always unique ... CHECK IT TOMORROW
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  //if I want to populate multiple fields, I can chain the methods
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  //however, we do not want the review to have data about the tour because it will always be called only when the tour is called... so, the review needs to have reference to the tour, but it does not need to be populated with tour data
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

//this is a static method
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  //in static methods, THIS points to the model. Therefore, we have access to the aggregate method.
  // console.log(tourId);
  const stats = await this.aggregate([
    {
      //at this stage we choose the tour, average rating of which we want to update
      $match: { tour: tourId }
    },
    {
      $group: {
        //here we group the reviews??? together by 'tour'
        _id: '$tour',
        //here we add 1 to an aggregate (like in REDUCE method) for every tour, thus counting the number of reviews
        nRating: { $sum: 1 },
        //here we count the average rating by adding rating from every review
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats); // [ { _id: [ 62694454a4030220a8d0123d ], nRating: 2, avgRating: 4 } ]
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, { ratingsAverage: stats[0].avgRating, ratingsQuantity: stats[0].nRating });
  } else {
    await Tour.findByIdAndUpdate(tourId, { ratingsAverage: 4.5, ratingsQuantity: 0 });
  }
};
//after we created a static method that counts the number of reviews and the average review, we create a middleware, that does the work every time the review is saved... it has to be POST so that the function would count ratings after the new review is saved in the DB.. REMEMBER: POST MIDDLEWARES do not have acces to NEXT
reviewSchema.post('save', function() {
  //here, this points to the current review DOCUMENT becuase of the SAVE method

  //because here we try to refer to 'Review' and it is not defined yet (see the end of this doc), we have a dilemma. How to address the model before it is declared?... so, here it is, we use THIS.CONSTRUCTOR to to the current model
  this.constructor.calcAverageRatings(this.tour);
  // Review.calcAverageRatings(this.tour);
  // next();
});

//when we counted and modified avgRating and nRating while creating the review, it was relatively simple, because we had acess to the document through the model (see above). However, on findByIdAndUpdate and findByIdAndDelete, we do not have access to the document, so we need to come up with some kind of logic or a trick. So, we create a PRE middleware
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //here, this points to the current QUERY becuase of the FIND-related methods

  // const r = await this.findOne(); // this is how we get access to the document from the query... LEARN MORE
  //BUT, to pass the REVIEW document (with the tour ID in it) to the POST middleware (see below), we create a property in the query instead of saving the review document inside this middleware finction
  this.r = await this.findOne();
  // console.log(this.r);
  //and now, after we have access to the tour from the review document, we need to calculate the ratings... but this is PRE middleware, while we need to calculate the rating AFTER the review is updated/deleted... so we create another middleware (see below)
  next();
});

//this middleware is directly connected to the one above
reviewSchema.post(/^findOneAnd/, async function() {
  //here we have access to the property we created in the PRE middleware (see above). So, we use it to calculate ratings of the tour AFTER the review was updated/deleted
  await this.r.constructor.calcAverageRatings(this.r.tour); // IMPORTANT: as in this case THIS refers to the QUERY and NOT REVIEW, we first need to have acess to the model of the REVIEW... because we saved the REVIEW document as a property in our query,and it has access to the REVEIW model, we get access to the model through it... and, as it is required before the actial Review model is created, we use the constructor... GENIUS!!!
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
