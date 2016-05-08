exports = module.exports = function(bookshelf) {
  var UserRole = bookshelf.Model.extend({
    tableName: 'usersRoles',
    hasTimestamps: ['createdAt', 'updatedAt'],
    user: function() {
      return this.belongsTo('User', 'id');
    },
    role: function() {
      return this.belongsTo('Role', 'id');
    }
  });

  return bookshelf.model('UserRole', UserRole);
}
