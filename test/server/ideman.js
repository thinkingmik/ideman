var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://postgres:postgres@pandora.net/ideman?charset=utf-8',
});
var Bookshelf = require('bookshelf')(knex);
var ideman = require('../../')(Bookshelf);

ideman.init();

module.exports = ideman;
