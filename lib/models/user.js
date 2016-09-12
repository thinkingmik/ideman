var Promise = require('bluebird');
var config = require('../configuration').getParams();
var cryptoManager = require('../utils/cryptoManager');
var PasswordHashError = require('../exceptions/passwordHashError');
bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

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
      this.on('creating', function (model) {
				if (config.user.passwordEnc === 'bcrypt') {
					return bcrypt.genSaltAsync(5)
					.then(function (salt) {
						return bcrypt.hashAsync(model.get('password'), salt, null);
					})
					.then(function (hash) {
						model.set('password', hash);
					})
          .catch(function (err) {
            throw new PasswordHashError('Error while generating bcrypt hash');
          });
				}
				else if (config.user.passwordEnc === 'crypto') {
					return cryptoManager.cypher(model.get('password'))
					.then(function(hash) {
						model.set('password', hash);
					})
          .catch(function (err) {
            throw new PasswordHashError('Error while generating crypto hash');
          });
				}
				else {
					return model.set('password', model.get('password'));
				}
      });
      this.on('updating', function (model) {
        if (!_.isUndefined(model.get('password')) && !_.isNull(model.get('password'))) {
          if (config.user.passwordEnc === 'bcrypt') {
  					return bcrypt.genSaltAsync(5)
  					.then(function (salt) {
  						return bcrypt.hashAsync(model.get('password'), salt, null);
  					})
  					.then(function (hash) {
  						model.set('password', hash);
  					})
            .catch(function (err) {
              throw new PasswordHashError('Error while generating bcrypt hash');
            });
  				}
  				else if (config.user.passwordEnc === 'crypto') {
  					return cryptoManager.cypher(model.get('password'))
  					.then(function(hash) {
  						model.set('password', hash);
  					})
            .catch(function (err) {
              throw new PasswordHashError('Error while generating crypto hash');
            });
  				}
  				else {
  					return model.set('password', model.get('password'));
  				}
        }
      });
    },
    verifyPassword: function (password) {
			if (config.user.passwordEnc === 'bcrypt') {
				return bcrypt.compareAsync(password, this.get('password'))
        .catch(function (err) {
          throw new PasswordHashError('Not a valid BCrypt hash');
        });
			}
			else if (config.user.passwordEnc === 'crypto') {
				return cryptoManager.compare(password, this.get('password'))
        .catch(function (err) {
          throw new PasswordHashError('Not a valid Crypto hash');
        });
			}
			else {
				return (password === this.get('password'));
			}
    }
  });

  return bookshelf.model(dbConfig.entities.user.model, User);
}
