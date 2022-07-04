const mongoose = require('mongoose');
// package to create tour slugs for future requests (пакет для создания спец названий туров для будущего поиска)
const slugify = require('slugify');

// a mongoose schema for tours (схема для туров)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have 40 characters maximum'],
      minlength: [10, 'Tour name must have 10 characters minimum']
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
      set: val => Math.round(val * 10) / 10
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
      validate: {
        // custom validator (кастомная проверка валидности данных)
        validator: function(val) {
          return val < this.price;
        },
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
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
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
    guides: [
      {
        // reference to another model in the DB (связь с другой моделью в базе данных)
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  // allows virutal (разрешает виртуальные поля данных)
  { toJSON: { virtuals: true }, toObjects: { virtuals: true } }
);

// create indexes on certain fields in the schema (создает индексацию отдельных полей данных в схеме)
tourSchema.index({ price: 1, ratingsAverage: -1 }); // this is compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// creates a virutal property (создает вирутальные данные)
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// creates and populates a virtual field with tour reviews (создает и наполняет виртуальные данные об отзывах на тур)
tourSchema.virtual('reviews', {
  ref: 'Review', // required model
  foreignField: 'tour', // requested data field
  localField: '_id' // searched data
});

// creates and stores the slug of the tour based on its name (создает и сохраняет slug на базе названия тура)
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// excludes all the secret tours during the tour search (исключает все секретные туры из результатов поиска)
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// populates tours with the content from referenced collections (наполняет результаты поиска информацией о гидах)
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// logs the time the query took (отображает время, за которой был выполнен запрос)
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
