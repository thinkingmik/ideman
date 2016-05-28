module.exports = {
  oauth2: {
    authentications: ['basic', 'bearer'],
    grants: ['client_credentials', 'password', 'refresh_token']
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
