var Promise = require('bluebird');
bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

exports = module.exports = function(bookshelf, config) {
  var User = bookshelf.Model.extend({
    tableName: config.prefix + config.entities.user.table,
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany(config.entities.token.model, 'userId');
    },
    codes: function() {
      return this.hasMany(config.entities.code.model, 'userId');
    },
    initialize: function () {
      this.on('creating', function (model) {
        return bcrypt.genSaltAsync(5)
        .then(function (salt) {
          return bcrypt.hashAsync(model.get('password'), salt, null);
        })
        .then(function (hash) {
          model.set('password', hash);
        });
      });
    },
    verifyPassword: function (password) {
      return bcrypt.compareAsync(password, this.get('password'));
    }
  });

  return bookshelf.model(config.entities.user.model, User);
}
