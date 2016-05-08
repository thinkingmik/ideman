exports = module.exports = function(bookshelf) {
  var Role = bookshelf.Model.extend({
    tableName: 'roles',
    hasTimestamps: ['createdAt', 'updatedAt'],
    usersRoles: function() {
      return this.hasMany('UserRole', 'roleId');
    },
    policies: function() {
      return this.hasMany('Policy', 'roleId');
    }
  });

  return bookshelf.model('Role', Role);
}
