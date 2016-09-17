var headerHelper = require('../utils/headerParser');
var crypto = require('../utils/cryptoManager');
var config = require('../configuration').getParams();
var db = require('../database').getParams();
var consts = require('../constants');
var validator = require('../utils/paramChecker');
var AutoLoader = require('../autoLoader');
var NotFoundError = require('../exceptions/notFoundError');

var fillClientCredentials = function(req, res, callback) {
  // Input validation
  if (consts.validation.enabled === true) {
    try {
      req.body['username'] = validator.sanitizeParam(consts.validation.types.mixed, req.body['username'], true, config.validation.username);
      req.body['password'] = validator.sanitizeParam(consts.validation.types.mixed, req.body['password'], true, config.validation.password);
      req.body['client_id'] = validator.sanitizeParam(consts.validation.types.mixed, req.body['client_id'], true, config.validation.clientId);
      req.body['client_secret'] = validator.sanitizeParam(consts.validation.types.mixed, req.body['client_secret'], true, config.validation.clientSecret);
    }
    catch (err) {
      return callback(err);
    }
  }

  var isBasicAuth = false;
  var grant = req.body['grant_type'];
  var auth = req.headers['authorization'];
  var username = req.body['username'];
  var password = req.body['password'];
  var clientId = req.body['client_id'];
  var clientSecret = req.body['client_secret'];

  // Add ip address and user agent to request
  req.body['userAgent_auto_generated'] = headerHelper.getUA(req);
  req.body['ipAddress_auto_generated'] = headerHelper.getIP(req);

  if (auth && auth.indexOf('Basic') >= 0) {
    isBasicAuth = true;
  }

  if (!config.oauth2.useClientSecret && grant !== 'client_credentials' && clientId && !clientSecret && !isBasicAuth) {
    return AutoLoader.getModel(db.entities.client.model).forge()
    .where({
      name: clientId,
      enabled: true
    })
    .fetch({
      columns: ['id', 'secret']
    })
    .then(function(client) {
      if (!client) {
        throw new NotFoundError('Client not found');
      }
      return crypto.decypher(client.get('secret'));
    })
    .then(function(secret) {
      // Add secret key to request
      req.body['client_secret'] = secret;
    })
    .nodeify(function(err, result) {
      if (!err) {
        return callback(null, result, { scope: '*' });
      }
      else if (err instanceof NotFoundError) {
        return callback(null, false);
      }
      else {
        return callback(err);
      }
    });
  }
  else {
    return callback();
  }
}

exports.fillClientCredentials = fillClientCredentials;
