// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('./../utils/catchAsync');
// one of our utils that catches the errors (наша утилита для обработки ошибок)
const AppError = require('./../utils/appError');
// one of our utils that modifies the query to make the proper request to the database (наша утилита для изменения/подготовки запроса в базу данных)
const APIFeatures = require('./../utils/apiFeatures');

/**
 * universal function used to delete a document from the model in DB (универасальная функция для удаления документа из базы данных)
 * @param {DBmodel}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

/**
 * universal function used to update a document from the model in DB (универасальная функция для обновления документа в базе данных)
 * @param {DBmodel}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the new/updated document/data (возвращает новую версию документа)
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

/**
 *universal function used to create a document from the model in DB (универасальная функция для создания документа в базе данных)
 * @param {DBmodel}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
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

/**
 * universal function used to retrieve a document from the model in DB. Here, because getTour function had options to populate reviews, we have to add this opportunity to our factory handler (универсальная функция для поиска документа в базе данных. В случае с getTour может возникнуть необходимость популяции некоторых пунктов в документе, и для этого добавлен еще один аргумент в функции)
 * @param {DBmodel, object}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
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

/**
 * universal function used to retrieve all the documents from the model in DB (универасальная функция для вывода всех документов из базы данных)
 * @param {DBmodel}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // this is a small hack to make this function usable in the nested routes (этот хак позволяет использовать функцию во вложенных маршрутах)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // I also added 'filter' to the line below as an argument (я также добавил фильтр ниже, чтобы он использовался, если возникнет необходимость)
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { data: docs }
    });
  });
