module.exports = {
  dialog: {
    page: 'dialog'
  },
  oauth2: {
    useClientSecret: false,
    authentications: ['basic', 'bearer'],
    grants: ['client_credentials', 'password', 'refresh_token', 'authorization_code']
  },
  ldap: {
    enabled: false,
    ldapper: null,
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'dn'
  },
  validation: {
    enabled: false,
    username: /^[\w\.]{2,100}$/g,
    password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[.)(=,|$@$!%*#?&])[A-Za-z\d.)(=,|$@$!%*#?&]{8,255}$/g,
    clientId: /^[\w\.]{2,100}$/g,
    clientSecret: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[.)(=,|$@$!%*#?&])[A-Za-z\d.)(=,|$@$!%*#?&]{8,255}$/g,
  },
  user: {
    passwordEnc: 'bcrypt'
  },
  crypton: null,
  token: {
    life: 3600, //seconds
    length: 32, //bytes
    autoRemove: true,
    jwt: {
      enabled: false,
      ipcheck: false,
      uacheck: false,
      secretKey: 'K7pHX4OASe?c&lm',
      cert: null,
      algorithm: 'RS256'
    }
  }
}
