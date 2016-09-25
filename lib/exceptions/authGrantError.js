module.exports = function AuthGrantError(message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 403 || status;
  this.message = message;
};

require('util').inherits(module.exports, Error);
