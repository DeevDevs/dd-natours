// this classes is built on the basis of the Error class/object ??? ... LEARN MORE
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // console.log('Error with invalid URL');
    // this line of code below makes the error do not appear in the stack and do not pollute it... LEARN MORE
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
