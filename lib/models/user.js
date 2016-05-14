var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

exports = module.exports = function(bookshelf) {
  var User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimestamps: ['createdAt', 'updatedAt'],
    tokens: function() {
      return this.hasMany('Token', 'userId');
    },
    codes: function() {
      return this.hasMany('Code', 'userId');
    },
    usersRoles: function() {
      return this.hasMany('UserRole', 'userId');
    },
    policies: function() {
      return this.hasMany('Policy', 'userId');
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

  return bookshelf.model('User', User);
}
