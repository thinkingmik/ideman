var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://postgres:postgres@localhost:5432/node-server-src?charset=utf-8&ssl=true',
  pool: { min: 2, max: 10 }
});
var Bookshelf = require('bookshelf')(knex);
var ideman = require('../lib/ideman')(Bookshelf);

ideman.init({
  token: {
    life: 1600,
    length: 16,
    jwt: {
      enabled: true
    }
  },
  crypto: {
    outputEncoding: 'hex'
  }
});

var config = ideman.getConfig();
var model = ideman.getModel('User');

console.log(config);
//console.log(ideman.getBookshelf());
model.forge().fetch().then(x => { console.log(x); });
