exports = module.exports = function(bookshelf, config) {
  var Code = bookshelf.Model.extend({
    tableName: config.prefix + config.entities.code.table,
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo(config.entities.user.model, 'id');
    },
    client: function() {
      return this.belongsTo(config.entities.client.model, 'id');
    }
  });

  return bookshelf.model(config.entities.code.model, Code);
}
