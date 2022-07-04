const mongoose = require('mongoose');
// use model based on the mongoose schema (использует модель на основе mongoose схемы)
const Tour = require('./tourModel');

// a mongoose schema for reviews (схема для отзывов)
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review must have a text description'],
      maxLength: [500, 'Your review should not contain more than 500 characters']
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

// prevents multiple reviews of one user on the same tour (предотвращает наличие более одного отзыва на тур от одного пользователя)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populates the search results with user info (наполняет результаты поиска данными о пользователях)
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

/**
 *  counts average rating of tours (подсчитывает рейтинг туров)
 * @param {string}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, { ratingsAverage: stats[0].avgRating, ratingsQuantity: stats[0].nRating });
  } else {
    await Tour.findByIdAndUpdate(tourId, { ratingsAverage: 4.5, ratingsQuantity: 0 });
  }
};

// counts rating of the tour after every new review added (подсчитывает рейтинг тура после каждого нового отзыва)
reviewSchema.post('save', function() {
  // address the model before it is declared (обращаемся к модели до ее декларации)
  this.constructor.calcAverageRatings(this.tour);
});

// it creates a property that refers to the model before the find methods are applied (создает параметр в запросе с данными о модели)
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

// it refers to the earlier created review model property to calculate the rating (используя данные в запросы, связывается с нужной моделью)
reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
