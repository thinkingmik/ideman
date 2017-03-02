module.exports = {
  prefix: '',
  entities: {
    user: {
      table: 'users',
      model: 'User',
      file: 'user.js'
    },
    client: {
      table: 'clients',
      model: 'Client',
      file: 'client.js'
    },
    token: {
      table: 'tokens',
      model: 'Token',
      file: 'token.js'
    },
    code: {
      table: 'codes',
      model: 'Code',
      file: 'code.js'
    }
  }
}
