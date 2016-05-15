var fs = require('fs');
var path = require('path');

function AutoLoader() {
  this._models = {};
  this._tablePrefix = 'idm_';
  this._bookshelf = null;
}

AutoLoader.prototype.init = function(bookshelf) {
  bookshelf.plugin('registry');
  var models = {};
  fs.readdirSync(__dirname + '/models').forEach(function(filename) {
    if (/\.js$/.test(filename)) {
      var name = path.basename(filename, '.js');
      var modelFunc = require('./models/' + name);
      var model = modelFunc(bookshelf, this._tablePrefix);
      var cap = name.substr(0, 1).toUpperCase() + name.substr(1);
      models[cap] = model;
    }
  });
  this._models = models;
  this._bookshelf = bookshelf;
}

AutoLoader.prototype.getModels = function() {
  return this._models;
}

AutoLoader.prototype.getModel = function(name) {
  return this._models[name] || null;
}

AutoLoader.prototype.getBookshelf = function() {
  return this._bookshelf;
}

exports = module.exports = new AutoLoader;
