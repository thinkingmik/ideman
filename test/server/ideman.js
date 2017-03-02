var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "C:\\Temp\\ideman_tst.sqlite3"
  },
	useNullAsDefault: true
});
var Bookshelf = require('bookshelf')(knex);
var ideman = require('../../')(Bookshelf, { prefix: 'idm_' });

ideman.init({
  token: {
    autoRemove: true
  },
  user: {
    passwordEnc: 'crypto'
  }
});

module.exports = ideman;
