exports = module.exports = function(bookshelf, pfx) {
  var Token = bookshelf.Model.extend({
    tableName: pfx + 'tokens',
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo('User', 'id');
    },
    client: function() {
      return this.belongsTo('Client', 'id');
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

  return bookshelf.model('Token', Token);
}
