function AutoLoader() {
  this._models = {};
  this._bookshelf = null;
}

AutoLoader.prototype.init = function(bookshelf, dbConfig) {
  bookshelf.plugin('registry');
  var models = {};
  for (var key in dbConfig.entities) {
    var entity = dbConfig.entities[key];
    var modelFunc = require('./models/' + entity.file);
    var model = modelFunc(bookshelf, dbConfig);
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
