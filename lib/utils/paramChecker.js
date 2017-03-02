var _ = require('lodash');
var util = require('util');
var validator = require('validator');
var consts = require('../constants').validation;
var ParamFormatError = require('../exceptions/paramFormatError');
var ParamNotFoundError = require('../exceptions/paramNotFoundError');
var ParamValidationError = require('../exceptions/paramValidationError');

/**
* Convert a param into a string
* @param {mixed} val
* @return {string}
*/
var asString = function (val) {
  if (_.isNull(val) || _.isUndefined(val)) {
    val = '';
  }
  return val.toString();
}

/**
* Check if the given param is valid
* @param {string} type
* @param {mixed} param
* @param {bool} nullable
* @return {mixed}
* @throws ParamNotFoundError, ParamFormatError, ParamValidationError
*/
var checkParamType = function (type, param, nullable, regexp) {
  try {
    switch (type) {
      case consts.types.boolean:
        val = checkParamBool(param, nullable);
        break;
      case consts.types.email:
        val = checkParamEmail(param, nullable);
        break;
      case consts.types.domain:
        val = checkParamDomain(param, nullable);
        break;
      case consts.types.name:
        val = checkParamName(param, nullable);
        break;
      case consts.types.username:
        val = checkParamUsername(param, nullable);
        break;
      case consts.types.integer:
        val = checkParamInt(param, nullable);
        break;
      case consts.types.text:
        val = checkParamText(param, nullable);
        break;
      case consts.types.date:
        val = checkParamDate(param, nullable);
        break;
      case consts.types.password:
        val = checkParamPassword(param, nullable);
        break;
      case consts.types.mixed:
        val = checkParamMixed(param, nullable, regexp);
        break;
      default:
        throw new ParamNotFoundError(util.format('Uknown type \'%s\' for param \'%s\'', type, param));
        break;
    }
    return val;
  }
  catch (err) {
    if (err instanceof ParamNotFoundError || err instanceof ParamFormatError) {
      throw err;
    }
    throw new ParamValidationError(err.message);
  }
}

/**
* Check if the given param matches a custom regexp
* @param {mixed} param
* @param {bool} nullable
* @param {string} regexp
* @return {string}
* @throws ParamFormatError
*/
var checkParamMixed = function (param, nullable, regexp) {
  //var flags = regexp.replace(/.*\/([gimy]*)$/, '$1');
  //var regexp = regexp.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
  var pattern = new RegExp(regexp);
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.matches(text, pattern)) {
    throw new ParamFormatError(util.format('Not a valid param format \'%s\'', text));
  }
  return text;
}

/**
* Check if the given param is a valid boolean
* @param {mixed} param
* @param {bool} nullable
* @return {bool}
* @throws ParamFormatError
*/
var checkParamBool = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.isBoolean(text)) {
    throw new ParamFormatError(util.format('Not a valid bool format \'%s\'', text));
  }
  return validator.toBoolean(text, true);
}

/**
* Check if the given param is a valid integer
* @param {mixed} param
* @param {bool} nullable
* @return {int}
* @throws ParamFormatError
*/
var checkParamInt = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.isInt(text)) {
    throw new ParamFormatError(util.format('Not a valid integer format \'%s\'', text));
  }
  return validator.toInt(text, 10);
}

/**
* Check if the given param is a valid email address
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamEmail = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.isEmail(text)) {
    throw new ParamFormatError(util.format('Not a valid email format \'%s\'', text));
  }
  return validator.normalizeEmail(text);
}

/**
* Check if the given param is a valid domain
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamDomain = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  var options = { require_tld: true, allow_underscores: true, allow_trailing_dot: false };
  if ((nullable === false && validator.isEmpty(text)) || !validator.isFQDN(text, options)) {
    throw new ParamFormatError(util.format('Not a valid fqdn format \'%s\'', text));
  }
  return validator.trim(text);
}

/**
* Check if the given param is a valid date
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamDate = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.isDate(text)) {
    throw new ParamFormatError(util.format('Not a valid date format \'%s\'', text));
  }
  return validator.toDate(text);
}

/**
* Check if the given param is a valid text
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamText = function (param, nullable) {
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text))) {
    throw new ParamFormatError(util.format('Not a valid text format \'%s\'', text));
  }
  return validator.trim(text);
}

/**
* Check if the given param is a valid name
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamName = function (param, nullable) {
  var pattern = /^[\w\.]{2,100}$/g;
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.matches(text, pattern)) {
    throw new ParamFormatError(util.format('Not a valid name format \'%s\'', text));
  }
  return validator.trim(text);
}

/**
* Check if the given param is a valid username
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamUsername = function (param, nullable) {
  var pattern = /^[\w\.]{2,100}$/g;
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !(validator.matches(text, pattern) || checkParamEmail(text, nullable))) {
    throw new ParamFormatError(util.format('Not a valid username format \'%s\'', text));
  }
  return validator.trim(text);
}

/**
* Check if the given param is a valid password
* @param {mixed} param
* @param {bool} nullable
* @return {string}
* @throws ParamFormatError
*/
var checkParamPassword = function (param, nullable) {
  var pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[.)(=,|$@$!%*#?&])[A-Za-z\d.)(=, | $@ $!%*#?&]{8,255}$/g;
  var text = asString(param);
  if (nullable === true && validator.isEmpty(text)) {
    return null;
  }
  if ((nullable === false && validator.isEmpty(text)) || !validator.matches(text, pattern)) {
    throw new ParamFormatError(util.format('Not a valid password format \'%s\'', text));
  }
  return validator.trim(text);
}

/* Public methods */
module.exports.sanitizeParam = checkParamType;
