exports = module.exports = function(bookshelf) {
  var Code = bookshelf.Model.extend({
    tableName: 'codes',
    hasTimestamps: ['createdAt'],
    user: function() {
      return this.belongsTo('User', 'id');
    },
    client: function() {
      return this.belongsTo('Client', 'id');
    }
  });

  return bookshelf.getModel('Code', Code);
}
