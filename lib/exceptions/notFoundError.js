module.exports = function NotFoundError(message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500 || status;
  this.message = message;
};

require('util').inherits(module.exports, Error);
