exports = module.exports = function(bookshelf, pfx) {
  var Code = bookshelf.Model.extend({
    tableName: pfx + 'codes',
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo('User', 'id');
    },
    client: function() {
      return this.belongsTo('Client', 'id');
    }
  });

  return bookshelf.model('Code', Code);
}
