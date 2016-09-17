var _ = require('lodash');
var Promise = require('bluebird');
var config = require('../configuration').getParams();
var cryptoManager = require('../utils/cryptoManager');

exports = module.exports = function(bookshelf, dbConfig) {
  var User = bookshelf.Model.extend({
    tableName: dbConfig.prefix + dbConfig.entities.user.table,
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany(dbConfig.entities.token.model, 'userId');
    },
    codes: function() {
      return this.hasMany(dbConfig.entities.code.model, 'userId');
    },
    initialize: function () {
      this.on('saving', function (model, attrs) {
        return cryptPassword(model, attrs);
      });
    },
    verifyPassword: function (password) {
      if (config.user.passwordEnc === 'bcrypt') {
        return cryptoManager.verify(password, this.get('password'));
      }
      else if (config.user.passwordEnc === 'crypto') {
        return cryptoManager.compare(password, this.get('password'));
      }
      else {
        return (password === this.get('password'));
      }
    }
  });

  var cryptPassword = function(model, attrs) {
    var pwd = model.get('password');
    if (!_.isUndefined(attrs['password']) && !_.isNull(attrs['password']) && attrs['password'] !== '') {
      pwd = attrs['password'];
    }

    if (!_.isUndefined(pwd) && !_.isNull(pwd) && pwd !== '') {
      if (config.user.passwordEnc === 'bcrypt') {
        return cryptoManager.crypt(pwd)
        .then(function (hash) {
          model.set('password', hash);
          attrs['password'] = hash;
        });
      }
      else if (config.user.passwordEnc === 'crypto') {
        return cryptoManager.cypher(pwd)
        .then(function(hash) {
          model.set('password', hash);
          attrs['password'] = hash;
        });
      }
      else {
        model.set('password', pwd);
        attrs['password'] = pwd;
        return Promise.resolve();
      }
    }

    return Promise.resolve();
  }

  return bookshelf.model(dbConfig.entities.user.model, User);
}
