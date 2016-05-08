exports = module.exports = function(bookshelf) {
  var Permission = bookshelf.Model.extend({
    tableName: 'permissions',
    hasTimestamps: ['createdAt', 'updatedAt'],
    policies: function() {
      return this.hasMany('Policy', 'permissionId');
    }
  });

  return bookshelf.model('Permission', Permission);
}
