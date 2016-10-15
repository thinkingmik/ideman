var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://postgres:postgres@pandora.net/ideman?charset=utf-8',
});
var Bookshelf = require('bookshelf')(knex);
var ideman = require('../../')(Bookshelf);

ideman.init({
  token: {
    autoRemove: true
  },
  validation: {
    enabled: false
  }
});

module.exports = ideman;
