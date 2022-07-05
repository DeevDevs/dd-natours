// this class is built on the basis of the Error class/object and allows us to process errors properly (класс построен на базе класса/объекта ошибок, и позволяет нам обрабатывать ошибки удобным образом)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // makes the error do not appear in the stack and do not pollute it (не отажает ошибки со всем стаком)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
