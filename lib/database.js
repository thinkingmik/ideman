var settings = require('./configs/dbconfig');

function Database() {
  this._config = settings;
}

Database.prototype.init = function(options) {
  if (options === null || options === {}) {
    return;
  }
  if (options.prefix) {
    this._config.prefix = options.prefix || '';
  }
  if (options.entities && options.entities.user) {
    this._config.entities.user['table'] = options.entities.user['table'] || this._config.entities.user['table'];
    this._config.entities.user['model'] = options.entities.user['model'] || this._config.entities.user['model'];
  }
  if (options.entities && options.entities.client) {
    this._config.entities.client['table'] = options.entities.client['table'] || this._config.entities.client['table'];
    this._config.entities.client['model'] = options.entities.client['model'] || this._config.entities.client['model'];
  }
  if (options.entities && options.entities.token) {
    this._config.entities.token['table'] = options.entities.token['table'] || this._config.entities.token['table'];
    this._config.entities.token['model'] = options.entities.token['model'] || this._config.entities.token['model'];
  }
  if (options.entities && options.entities.code) {
    this._config.entities.code['table'] = options.entities.code['table'] || this._config.entities.code['table'];
    this._config.entities.code['model'] = options.entities.code['model'] || this._config.entities.code['model'];
  }
}

Database.prototype.getParams = function() {
  return this._config;
}

exports = module.exports = new Database;
