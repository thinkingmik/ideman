var _ = require('lodash');
var settings = require('./settings');

function Configuration() {
  this._config = settings;
}

Configuration.prototype.init = function(options) {
  if (_.isNull(options) || _.isUndefined(options) || _.isEmpty(options)) {
    return;
  }
  if (!_.isNull(options.dialog) && !_.isUndefined(options.dialog)) {
    this._config.dialog['page'] = options.dialog['page'] || this._config.dialog['page'];
  }
  if (!_.isNull(options.oauth2) && !_.isUndefined(options.oauth2)) {
    this._config.oauth2['grants'] = options.oauth2['grants'] || this._config.oauth2['grants'];
    this._config.oauth2['authentications'] = options.oauth2['authentications'] || this._config.oauth2['authentications'];
    this._config.oauth2['useClientSecret'] =options.oauth2['useClientSecret'] || this._config.oauth2['useClientSecret'];
  }
  if (!_.isNull(options.validation) && !_.isUndefined(options.validation)) {
    this._config.validation['enabled'] = options.validation['enabled'] || this._config.validation['enabled'];
    this._config.validation['username'] = options.validation['username'] || this._config.validation['username'];
    this._config.validation['password'] = options.validation['password'] || this._config.validation['password'];
    this._config.validation['clientId'] = options.validation['clientId'] || this._config.validation['clientId'];
    this._config.validation['clientSecret'] = options.validation['useClientSecret'] || this._config.validation['useClientSecret'];
  }
  if (!_.isNull(options.user) && !_.isUndefined(options.user)) {
    this._config.user['passwordEnc'] = options.user['passwordEnc'] || this._config.user['passwordEnc'];
  }
  if (!_.isNull(options.crypto) && !_.isUndefined(options.crypto)) {
    this._config.crypto['inputEncoding'] = options.crypto['inputEncoding'] || this._config.crypto['inputEncoding'];
    this._config.crypto['outputEncoding'] = options.crypto['outputEncoding'] || this._config.crypto['outputEncoding'];
    this._config.crypto['secretKey'] = options.crypto['secretKey'] || this._config.crypto['secretKey'];
  }
  if (!_.isNull(options.token) && !_.isUndefined(options.token)) {
    this._config.token['life'] = options.token['life'] || this._config.token['life'];
    this._config.token['length'] = options.token['length'] || this._config.token['length'];

    if (!_.isNull(options.token.jwt) && !_.isUndefined(options.token.jwt)) {
      this._config.token.jwt['enabled'] = options.token.jwt['enabled'] || this._config.token.jwt['enabled'];
      this._config.token.jwt['ipcheck'] = options.token.jwt['ipcheck'] || this._config.token.jwt['ipcheck'];
      this._config.token.jwt['uacheck'] = options.token.jwt['uacheck'] || this._config.token.jwt['uacheck'];
      this._config.token.jwt['secretKey'] = options.token.jwt['length'] || this._config.token.jwt['secretKey'];
    }
  }
}

Configuration.prototype.getParams = function() {
  return this._config;
}

exports = module.exports = new Configuration;
