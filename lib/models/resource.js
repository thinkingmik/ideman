exports = module.exports = function(bookshelf) {
  var Resource = bookshelf.Model.extend({
    tableName: 'resources',
    hasTimestamps: ['createdAt', 'updatedAt'],
    policies: function() {
      return this.hasMany('Policy', 'resourceId');
    }
  });

  return bookshelf.model('Resource', Resource);
}
