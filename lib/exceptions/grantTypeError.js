module.exports = function grantTypeError(message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 501 || status;
  this.message = message;
};

require('util').inherits(module.exports, Error);
