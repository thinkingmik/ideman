var utility = require('../utils/utility');

module.exports = function LDAPBindError() {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.title = 'Error while binding user to LDAP';

	var e = utility.formatError(arguments);
	this.errcode = e.errcode;
	this.op = e.op;
	this.message = e.message;
	this.data = e.data;
};

require('util').inherits(module.exports, Error);
