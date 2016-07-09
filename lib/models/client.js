var cryptoManager = require('../utils/cryptoManager');
var PasswordHashError = require('../exceptions/passwordHashError');

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
      this.on('creating', function (model) {
        return cryptoManager.cypher(model.get('secret'))
        .then(function(hash) {
          model.set('secret', hash);
        })
        .catch(function (err) {
          throw new PasswordHashError('Error while generating Crypto hash');
        });
      });
    },
    verifySecret: function (secret) {
      return cryptoManager.compare(secret, this.get('secret'))
      .catch(function (err) {
        throw new PasswordHashError('Not a valid Crypto hash');
      });
    }
  });

  return bookshelf.model(dbConfig.entities.client.model, Client);
}
