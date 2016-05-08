var authMiddleware = require('./middlewares/authentication');
var AutoLoader = require('./autoLoader');

function IdentityManager(bookshelf) {
  this.autoLoader = null;
}

IdentityManager.prototype.use = function(bookshelf) {
  if (this.autoLoader === null) {
    this.autoLoader = AutoLoader.init(bookshelf);
  }
}
IdentityManager.prototype.model = function(name) {
  return this.autoLoader.model(name);
}
IdentityManager.prototype.bookshelf = function() {
  return this.autoLoader.bookshelf;
}

//Expose oauth2orize functions
IdentityManager.prototype.isAuthenticated = authMiddleware.isAuthenticated;
IdentityManager.prototype.isClientAuthenticated = authMiddleware.isClientAuthenticated;

//exports = module.exports = IdentityManager;
var ideman = exports = module.exports = new IdentityManager;
