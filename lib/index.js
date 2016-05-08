var authMiddleware = require('./middlewares/authentication');
var AutoLoader = require('./autoLoader');
var Configuration = require('./configuration');

function IdentityManager() {
  this.autoLoader = null;
  this.configuration = null;
}

IdentityManager.prototype.use = function(bookshelf) {
  if (this.autoLoader === null) {
    AutoLoader.init(bookshelf);
    this.autoLoader = AutoLoader;
  }
}
IdentityManager.prototype.init = function(options) {
  if (this.configuration === null) {
    Configuration.init(options);
    this.configuration = Configuration;
  }
}
IdentityManager.prototype.getModel = function(name) {
  return this.autoLoader.getModel(name);
}
IdentityManager.prototype.getBookshelf = function() {
  return this.autoLoader.getBookshelf();
}
IdentityManager.prototype.getConfig = function() {
  return this.configuration.getParams();
}

//Expose oauth2orize functions
IdentityManager.prototype.isAuthenticated = authMiddleware.isAuthenticated;
IdentityManager.prototype.isClientAuthenticated = authMiddleware.isClientAuthenticated;

//exports = module.exports = IdentityManager;
exports = module.exports = new IdentityManager;
