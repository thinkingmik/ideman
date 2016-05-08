module.exports = function ExpiredTokenError(message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 401 || status;
  this.message = message;
};

require('util').inherits(module.exports, Error);
