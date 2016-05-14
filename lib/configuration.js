var settings = require('./settings');

function Configuration() {
  this._config = settings;
}

Configuration.prototype.init = function(options) {
  if (options === null || options === {}) {
    return;
  }
  if (options.crypto) {
    this._config.crypto['inputEncoding'] = options.crypto['inputEncoding'] || this._config.crypto['inputEncoding'];
    this._config.crypto['outputEncoding'] = options.crypto['outputEncoding'] || this._config.crypto['outputEncoding'];
    this._config.crypto['secretKey'] = options.crypto['secretKey'] || this._config.crypto['secretKey'];
  }
  if (options.token) {
    this._config.token['life'] = options.token['life'] || this._config.token['life'];
    this._config.token['length'] = options.token['length'] || this._config.token['length'];
  }
  if (options.token && options.token.jwt) {
    this._config.token.jwt['enabled'] = options.token.jwt['enabled'] || this._config.token.jwt['enabled'];
    this._config.token.jwt['ipcheck'] = options.token.jwt['ipcheck'] || this._config.token.jwt['ipcheck'];
    this._config.token.jwt['uacheck'] = options.token.jwt['uacheck'] || this._config.token.jwt['uacheck'];
    this._config.token.jwt['secretKey'] = options.token.jwt['length'] || this._config.token.jwt['secretKey'];
  }
}

Configuration.prototype.getParams = function() {
  return this._config;
}

exports = module.exports = new Configuration;
