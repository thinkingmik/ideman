var headerHelper = require('../utils/headerParser');
var crypto = require('../utils/cryptoManager');
var config = require('../config');
var AutoLoader = require('../autoLoader');
var NotFoundError = require('../exceptions/notFoundError');

var fillClientCredentials = function(req, res, callback) {
  var grant = req.body['grant_type'];
  var clientId = req.body['client_id'];
  var clientSecret = req.body['client_secret'];
  var auth = req.headers['authorization'];
  var isBasicAuth = false;

  // Add ip address and user agent to request
  req.body['userAgent_auto_generated'] = headerHelper.getUA(req);
  req.body['ipAddress_auto_generated'] = headerHelper.getIP(req);

  if (auth != null && auth.indexOf('Basic') >= 0) {
    isBasicAuth = true;
  }

  if (grant !== 'client_credentials' && clientId && !clientSecret && !isBasicAuth) {
    AutoLoader.model('Client').forge()
    .where({
      name: clientId,
      enabled: true
    })
    .fetch({
      columns: ['id', 'secret']
    })
    .then(function(client) {
      if (!client) {
        throw new NotFoundError();
      }
      return crypto.decypher(client.get('secret'));
    })
    .then(function(secret) {
      // Add secret key to request
      req.body['client_secret'] = secret;
    })
    .nodeify(function(err, result) {
      if (!err) {
        callback(null, result, { scope: '*' });
      }
      else if (err instanceof NotFoundError) {
        callback(null, false);
      }
      else {
        callback(err);
      }
    });
  }
  else {
    return callback();
  }
}

exports.fillClientCredentials = fillClientCredentials;
