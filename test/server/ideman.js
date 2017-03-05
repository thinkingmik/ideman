var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://postgres:postgres@pandora.net/ideman?charset=utf-8',
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
