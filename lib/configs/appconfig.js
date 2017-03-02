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
    enabled: true,
    options: {
      ssl: false,
      timeout: null,
      connectTimeout: null,
      strictdn: true
    },
    domainControllers: [],
    searchScope: null,
    authAttributes: ['sAMAccountName'],
    root: {
      dn: null,
      password: {
        crypto: false,
        value: null
      }
    }
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
  crypto: {
    secretKey: 'o!rDE(Qbrq7u4OV',
    algorithm: 'AES-256-CBC',
    inputEncoding: 'utf8',
    outputEncoding: 'base64'
  },
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
