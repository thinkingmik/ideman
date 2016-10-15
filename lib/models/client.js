var _ = require('lodash');
var cryptoManager = require('../utils/cryptoManager');

module.exports = function(bookshelf, dbConfig) {
  var Client = bookshelf.Model.extend({
    tableName: dbConfig.prefix + dbConfig.entities.client.table,
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany(dbConfig.entities.token.model, 'clientId');
    },
    codes: function() {
      return this.hasMany(dbConfig.entities.code.model, 'clientId');
    },
    initialize: function () {
      this.on('saving', function (model, attrs) {
        return cipherSecret(model, attrs);
      });
    },
    verifySecret: function (secret) {
      return cryptoManager.compare(secret, this.get('secret'));
    }
  });

  var cipherSecret = function(model, attrs) {
    var secret = model.get('secret');
    if (!_.isUndefined(attrs['secret']) && !_.isNull(attrs['secret']) && attrs['secret'] !== '') {
      secret = attrs['secret'];
    }

    if (!_.isUndefined(secret) && !_.isNull(secret) && secret !== '') {
      return cryptoManager.cipher(model.get('secret'))
      .then(function(hash) {
        model.set('secret', hash);
      });
    }

    return Promise.resolve();
  }

  return bookshelf.model(dbConfig.entities.client.model, Client);
}
