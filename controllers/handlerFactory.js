const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    //this method find the document we want to update, then it uses the data that we want to replace the old one, and there is a set of options
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //this option makes the method return the new/updated document/data
      new: true,
      //this option enables validators set in the schema to validate the updates
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });

//here, because getTour function had options to populate reviews, we have to add this opportunity to our factory handler
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findById(req.params.id).populate('reviews');
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //this is a small hack to make this function usable in the nested routes
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //////////////// end of hack... I also added 'filter' to the line below as an argument ... it will only be used for reviews, and in case the filter is NOT empty

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //here we finally resolve the query after all the methods applied... we eventually USE it
    const docs = await features.query;
    // const docs = await features.query.explain(); //to get more informaton about the query, we may use EXPLAIN method

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { data: docs }
    });
  });
