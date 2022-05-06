//this function below is used to catch async function errors and is used in the functions below... whenever there is a request, it goes to the handler function, and and the handler runs the catchAsync first. Because catchAsync has a  ... COMPLICATED
module.exports = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    fn(req, res, next).catch(next);
  };
};
