var cryptoManager = require('../utils/cryptoManager');

module.exports = function(bookshelf) {
  var Client = bookshelf.Model.extend({
    tableName: 'clients',
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany('Token', 'clientId');
    },
    codes: function() {
      return this.hasMany('Code', 'clientId');
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

  return bookshelf.getModel('Client', Client);
}
