function AutoLoader() {
  this._models = {};
  this._bookshelf = null;
}

AutoLoader.prototype.init = function(bookshelf, config) {
  bookshelf.plugin('registry');
  var models = {};
  for (var key in config.entities) {
    var entity = config.entities[key];
    var modelFunc = require('./models/' + entity.file);
    var model = modelFunc(bookshelf, config);
    models[entity.model] = model;
  }
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
