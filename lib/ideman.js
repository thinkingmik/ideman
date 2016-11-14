var authMiddleware = require('./middlewares/authentication');
var authController = require('./controllers/oauth2');
var cryptoManager = require('./utils/cryptoManager');
var AutoLoader = require('./autoLoader');
var Configuration = require('./configuration');
var Database = require('./database');
var passport = require('passport');

function IdentityManager(bookshelf, dbConfig) {
  if (dbConfig) {
    Database.init(dbConfig);
  }
  if (bookshelf) {
    AutoLoader.init(bookshelf, Database.getParams());
  }
}

IdentityManager.prototype.init = function(options) {
  Configuration.init(options);
}

IdentityManager.prototype.getPassport = function() {
  return passport;
}

IdentityManager.prototype.getModel = function(name) {
  return AutoLoader.getModel(name);
}

IdentityManager.prototype.setModel = function(name, model) {
  return AutoLoader.setModel(name, model);
}

IdentityManager.prototype.getModels = function() {
  return AutoLoader.getModels();
}

IdentityManager.prototype.getBookshelf = function() {
  return AutoLoader.getBookshelf();
}

IdentityManager.prototype.getConfig = function() {
  return Configuration.getParams();
}

IdentityManager.prototype.getDbConfig = function() {
  return Database.getParams();
}

//Expose oauth2orize middlewares functions
IdentityManager.prototype.isAuthenticated = authMiddleware.isAuthenticated;
IdentityManager.prototype.isClientAuthenticated = authMiddleware.isClientAuthenticated;

//Expose oauth2orize controllers functions
IdentityManager.prototype.token = authController.token;
IdentityManager.prototype.logout = authController.logout;
IdentityManager.prototype.authorization = authController.authorization;
IdentityManager.prototype.decision = authController.decision;

//Expose oauth2orize public functions
IdentityManager.prototype.validateUserCredentials = authMiddleware.validateUserCredentials;
IdentityManager.prototype.validateClientCredentials = authMiddleware.validateClientCredentials;
IdentityManager.prototype.validateBearerToken = authMiddleware.validateBearerToken;
IdentityManager.prototype.exchangePassword = authController.exchangePassword;
IdentityManager.prototype.exchangeClientCredentials = authController.exchangeClientCredentials;
IdentityManager.prototype.exchangeRefreshToken = authController.exchangeRefreshToken;
IdentityManager.prototype.grantCode = authController.grantCode;
IdentityManager.prototype.exchangeCode = authController.exchangeCode;
IdentityManager.prototype.revokeToken = authController.revokeToken;

//Expose cryptoManager public functions
IdentityManager.prototype.cipher = cryptoManager.cipher;
IdentityManager.prototype.decipher = cryptoManager.decipher;
IdentityManager.prototype.compare = cryptoManager.compare;
IdentityManager.prototype.crypt = cryptoManager.crypt;
IdentityManager.prototype.verify = cryptoManager.verify;

exports = module.exports = function(bookshelf, dbConfig) {
  return new IdentityManager(bookshelf, dbConfig);
}
