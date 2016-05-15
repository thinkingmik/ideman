var cryptoManager = require('../utils/cryptoManager');

module.exports = function(bookshelf, pfx) {
  var Client = bookshelf.Model.extend({
    tableName: pfx + 'clients',
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

  return bookshelf.model('Client', Client);
}
