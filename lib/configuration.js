var _ = require('lodash');
var settings = require('./configs/appconfig');

function Configuration() {
  this._config = settings;
}

Configuration.prototype.init = function(options) {
  if (_.isNull(options) || _.isUndefined(options) || _.isEmpty(options)) {
    return;
  }
  if (!_.isNull(options.dialog) && !_.isUndefined(options.dialog)) {
    this._config.dialog['page'] = selectConfigValue(options.dialog['page'], this._config.dialog['page']);
  }
  if (!_.isNull(options.oauth2) && !_.isUndefined(options.oauth2)) {
    this._config.oauth2['grants'] = selectConfigValue(options.oauth2['grants'], this._config.oauth2['grants']);
    this._config.oauth2['authentications'] = selectConfigValue(options.oauth2['authentications'], this._config.oauth2['authentications']);
    this._config.oauth2['useClientSecret'] = selectConfigValue(options.oauth2['useClientSecret'], this._config.oauth2['useClientSecret']);
  }
  if (!_.isNull(options.validation) && !_.isUndefined(options.validation)) {
    this._config.validation['enabled'] = selectConfigValue(options.validation['enabled'], this._config.validation['enabled']);
    this._config.validation['username'] = selectConfigValue(options.validation['username'], this._config.validation['username']);
    this._config.validation['password'] = selectConfigValue(options.validation['password'], this._config.validation['password']);
    this._config.validation['clientId'] = selectConfigValue(options.validation['clientId'], this._config.validation['clientId']);
    this._config.validation['clientSecret'] = selectConfigValue(options.validation['useClientSecret'], this._config.validation['useClientSecret']);
  }
  if (!_.isNull(options.user) && !_.isUndefined(options.user)) {
    this._config.user['passwordEnc'] = selectConfigValue(options.user['passwordEnc'], this._config.user['passwordEnc']);
  }
  if (!_.isNull(options.crypton) && !_.isUndefined(options.crypton)) {
    if (!_.isNull(options.crypton.crypto) && !_.isUndefined(options.crypton.crypto)) {
      this._config.crypton.crypto['inputEncoding'] = selectConfigValue(options.crypton.crypto['inputEncoding'], this._config.crypton.crypto['inputEncoding']);
      this._config.crypton.crypto['outputEncoding'] = selectConfigValue(options.crypton.crypto['outputEncoding'], this._config.crypton.crypto['outputEncoding']);
      this._config.crypton.crypto['secretKey'] = selectConfigValue(options.crypton.crypto['secretKey'], this._config.crypton.crypto['secretKey']);
      this._config.crypton.crypto['algorithm'] = selectConfigValue(options.crypton.crypto['algorithm'], this._config.crypton.crypto['algorithm']);
    }
    if (!_.isNull(options.crypton.bcrypt) && !_.isUndefined(options.crypton.bcrypt)) {
      this._config.crypton.bcrypt['saltRounds'] = selectConfigValue(options.crypton.bcrypt['saltRounds'], this._config.crypton.bcrypt['saltRounds']);
    }
  }
  if (!_.isNull(options.token) && !_.isUndefined(options.token)) {
    this._config.token['life'] = selectConfigValue(options.token['life'], this._config.token['life']);
    this._config.token['length'] = selectConfigValue(options.token['length'], this._config.token['length']);
    this._config.token['autoRemove'] = selectConfigValue(options.token['autoRemove'], this._config.token['autoRemove']);

    if (!_.isNull(options.token.jwt) && !_.isUndefined(options.token.jwt)) {
      this._config.token.jwt['enabled'] = selectConfigValue(options.token.jwt['enabled'], this._config.token.jwt['enabled']);
      this._config.token.jwt['ipcheck'] = selectConfigValue(options.token.jwt['ipcheck'], this._config.token.jwt['ipcheck']);
      this._config.token.jwt['uacheck'] = selectConfigValue(options.token.jwt['uacheck'], this._config.token.jwt['uacheck']);
      this._config.token.jwt['secretKey'] = selectConfigValue(options.token.jwt['length'], this._config.token.jwt['secretKey']);
    }
  }
  if (!_.isNull(options.ldap) && !_.isUndefined(options.ldap)) {
    this._config.ldap['enabled'] = selectConfigValue(options.ldap['enabled'], this._config.ldap['enabled']);
    this._config.ldap['domainControllers'] = selectConfigValue(options.ldap['domainControllers'], this._config.ldap['domainControllers']);
    this._config.ldap['searchScope'] = selectConfigValue(options.ldap['searchScope'], this._config.ldap['searchScope']);
    this._config.ldap['authAttributes'] = selectConfigValue(options.ldap['authAttributes'], this._config.ldap['authAttributes']);
    this._config.ldap['returnAttribute'] = selectConfigValue(options.ldap['returnAttribute'], this._config.ldap['returnAttribute']);

    if (!_.isNull(options.ldap.options) && !_.isUndefined(options.ldap.options)) {
      this._config.ldap.options['ssl'] = selectConfigValue(options.ldap.options['ssl'], this._config.ldap.options['ssl']);
      this._config.ldap.options['timeout'] = selectConfigValue(options.ldap.options['timeout'], this._config.ldap.options['timeout']);
      this._config.ldap.options['connectTimeout'] = selectConfigValue(options.ldap.options['connectTimeout'], this._config.ldap.options['connectTimeout']);
      this._config.ldap.options['strictdn'] = selectConfigValue(options.ldap.options['strictdn'], this._config.ldap.options['strictdn']);
    }

    if (!_.isNull(options.ldap.root) && !_.isUndefined(options.ldap.root)) {
      this._config.ldap.root['dn'] = selectConfigValue(options.ldap.root['dn'], this._config.ldap.root['dn']);

      if (!_.isNull(options.ldap.root.password) && !_.isUndefined(options.ldap.root.password)) {
        this._config.ldap.root.password['crypto'] = selectConfigValue(options.ldap.root.password['crypto'], this._config.ldap.root.password['crypto']);
        this._config.ldap.root.password['value'] = selectConfigValue(options.ldap.root.password['value'], this._config.ldap.root.password['value']);
      }
    }
  }
}

Configuration.prototype.getParams = function() {
  return this._config;
}

var selectConfigValue = function(custom, def) {
  if (_.isNull(custom) || _.isUndefined(custom) || (_.isArray(custom) && custom.length <= 0)) {
    return def;
  }
  return custom;
}

exports = module.exports = new Configuration;
