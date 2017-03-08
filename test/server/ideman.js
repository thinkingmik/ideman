var knex = require('knex')({
  //client: 'pg',
  //connection: 'postgres://postgres:postgres@pandora.net/ideman?charset=utf-8',
  client: 'mariasql',
  connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      db: 'test'
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
  },
  ldap: {
    enabled: false,
    domainControllers: ['192.168.99.100'],
    searchScope: 'ou=users,dc=acme,dc=com',
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'mail',
    root: {
      dn: 'cn=admin,dc=acme,dc=com',
      password: {
        crypto: true,
        value: 'uV1ju3uY1JerhQ9z/nPr2w=='
      }
    }
  }
});

module.exports = ideman;
