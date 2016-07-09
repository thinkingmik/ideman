exports = module.exports = function(bookshelf, dbConfig) {
  var Token = bookshelf.Model.extend({
    tableName: dbConfig.prefix + dbConfig.entities.token.table,
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo(dbConfig.entities.user.model, 'id');
    },
    client: function() {
      return this.belongsTo(dbConfig.entities.client.model, 'id');
    },
    removeBy: function (clause, trx) {
      return bookshelf.knex(this.tableName)
      .where(clause)
      .transacting(trx || {})
      .returning('id')
      .del()
      .then(function(res) {
        return res;
      });
    }
  });

  return bookshelf.model(dbConfig.entities.token.model, Token);
}
