// a kind of wrap that allows to catch async errors, so we don't need to build the try/catch block all the time (пзволяет заворачивать функции с асинхронным кодом в себя, чтобы отслеживать ошибки. Так, нам не нужно постоянно ипользовать try/catch блок)
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
