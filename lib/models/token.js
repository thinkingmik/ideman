exports = module.exports = function(bookshelf, config) {
  var Token = bookshelf.Model.extend({
    tableName: config.prefix + config.entities.token.table,
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo(config.entities.user.model, 'id');
    },
    client: function() {
      return this.belongsTo(config.entities.client.model, 'id');
    },
    removeBy: function (clause, trx) {
      return bookshelf.knex(this.tableName)
      .where(clause)
      .transacting(trx || {})
      .returning('id')
      .del()
      .then(function(res) {
        return res.length;
      });
    }
  });

  return bookshelf.model(config.entities.token.model, Token);
}
