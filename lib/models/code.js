exports = module.exports = function(bookshelf, dbConfig) {
  var Code = bookshelf.Model.extend({
    tableName: dbConfig.prefix + dbConfig.entities.code.table,
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo(dbConfig.entities.user.model, 'id');
    },
    client: function() {
      return this.belongsTo(dbConfig.entities.client.model, 'id');
    }
  });

  return bookshelf.model(dbConfig.entities.code.model, Code);
}
