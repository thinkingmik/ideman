var fs = require('fs');
var path = require('path');

function AutoLoader() {
  this.models = {};
  this.bookshelf = null;
}

AutoLoader.prototype.init = function(bookshelf) {
  bookshelf.plugin('registry');
  var models = {};
  fs.readdirSync(__dirname + '/models').forEach(function(filename) {
    if (/\.js$/.test(filename)) {
      var name = path.basename(filename, '.js');
      var modelFunc = require('./models/' + name);
      var model = modelFunc(bookshelf);
      var cap = name.substr(0, 1).toUpperCase() + name.substr(1);
      models[cap] = model;
    }
  });
  this.models = models;
  this.bookshelf = bookshelf;
  return this;
}

AutoLoader.prototype.getModels = function() {
  return this.models;
}

AutoLoader.prototype.getModel = function(name) {
  return this.models[name];
}

AutoLoader.prototype.getBookshelf = function() {
  return this.bookshelf;
}

exports = module.exports = new AutoLoader;
