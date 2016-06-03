var cryptoManager = require('../utils/cryptoManager');

module.exports = function(bookshelf, config) {
  var Client = bookshelf.Model.extend({
    tableName: config.prefix + config.entities.client.table,
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany(config.entities.token.model, 'clientId');
    },
    codes: function() {
      return this.hasMany(config.entities.code.model, 'clientId');
    },
    initialize: function () {
      this.on('creating', function (model) {
        return cryptoManager.cypher(model.get('secret'))
        .then(function(hash) {
          model.set('secret', hash);
        });
      });
    },
    verifySecret: function (secret) {
      return cryptoManager.compare(secret, this.get('secret'));
    }
  });

  return bookshelf.model(config.entities.client.model, Client);
}
