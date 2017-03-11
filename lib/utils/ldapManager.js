var _ = require('lodash');
var util = require('util');
var ldap = require('ldapjs');
var Promise = require('bluebird');
var config = require('../configuration').getParams();
var Crypton = require('crypton');
var handleError = require('../utils/handleJsonResponse').Error;
var LDAPConnectionError = require('../exceptions/ldapConnectionError');
var LDAPBindError = require('../exceptions/ldapBindError');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPSearchError = require('../exceptions/ldapSearchError');

var createLDAPClient = function(retry, err) {
  retry = (_.isNull(retry) || _.isUndefined(retry)) ? 0 : retry;

  if (retry >= config.ldap.domainControllers.length) {
    var msg = util.format('Unable to connect to LDAP server: %s', JSON.stringify(config.ldap.domainControllers));
    return Promise.reject(new LDAPConnectionError(msg));
  }

  return connect(config.ldap.domainControllers[retry])
  .catch(function(err) {
    return createLDAPClient(retry + 1, err);
  });
}

var connect = function(dc) {
  var protocol = (config.ldap.options.ssl === true) ? 'ldaps://' : 'ldap://';
  var options = {
    url: protocol + dc,
    timeout: config.ldap.options.timeout,
    connectTimeout: config.ldap.options.connectTimeout,
    strictDN: config.ldap.options.strictdn
  };

  return new Promise(function (resolve, reject) {
      var client = ldap.createClient(options);
      client.on('connect', function() {
        Promise.promisifyAll(client);
        return resolve(client);
      });
      client.on('error', function(err) {
        return reject(err);
      });
  });
}

var ldapAuthentication = function(user, password) {
  return createLDAPClient()
  .bind({})
  .then(function(client) {
    this.client = client;
    if (config.ldap.root.password.crypto === true) {
      var cryptoManager = new Crypton(config.crypton);

      return cryptoManager.decipher(config.ldap.root.password.value)
      .catch(function(err) {
        throw new LDAPBindError(err);
      });
    }
    return config.ldap.root.password.value;
  })
  .then(function(clearPassword) {
    var self = this;
    return self.client.bindAsync(config.ldap.root.dn, clearPassword)
    .catch(function(err) {
      throw new LDAPBindError(err);
    });
  })
  .then(function(res) {
    var self = this;
    var parts = '';
    _.each(config.ldap.authAttributes, function(attr) {
      var p = util.format('(%s=%s)', attr, user);
      parts += p;
    });
    var customFilter = util.format('(|%s)', parts);

  	return self.client.searchAsync(config.ldap.searchScope, { filter: customFilter, scope: 'sub', attributes: ['dn', config.ldap.returnAttribute] })
    .then(function(search) {
      return new Promise(function(resolve, reject) {
        var entryResult = [];
        search.on('searchEntry', function(entry) {
          entryResult.push(entry);
        });
        search.on('error', function(err) {
          return reject(new LDAPSearchError(err));
        });
        search.on('end', function(result) {
          return resolve(entryResult);
        });
      });
    });
  })
  .then(function(entry) {
    var self = this;
    self.returnValue = null;

    if (!_.isArray(entry) || entry.length === 0 || entry.length > 1) {
      return self.returnValue;
    }

    return self.client.bindAsync(entry[0].object.dn, password)
    .then(function(res) {
      self.returnValue = entry[0].object.dn;
      if (!_.isNull(entry[0].object[config.ldap.returnAttribute]) && !_.isUndefined(entry[0].object[config.ldap.returnAttribute])) {
        self.returnValue = entry[0].object[config.ldap.returnAttribute];
      }
      return self.returnValue;
    })
    .catch(function(err) {
      return self.returnValue;
    });
  })
  .then(function(res) {
    var self = this;
    return self.client.unbindAsync()
    .then(function() {
      return self.returnValue;
    })
    .catch(function(err) {
      throw new LDAPUnbindError(err);
    });
  })
  .catch(function(err) {
    throw err;
  });
}

module.exports.ldapAuthentication = ldapAuthentication;
