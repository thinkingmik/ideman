var oauth2orize = require('oauth2orize');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var Moment = require('moment');
var Promise = require('bluebird');
var AutoLoader = require('../autoLoader');
var headerHelper = require('../utils/headerParser');
var config = require('../configuration').getParams();
var db = require('../database').getParams();
var NotFoundError = require('../exceptions/notFoundError');
var handleError = require('../utils/handleJsonResponse').Error;
var handleSuccess = require('../utils/handleJsonResponse').Success;

// Create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization function
server.serializeClient(function(client, callback) {
  return callback(null, client.get('id'));
});

// Register deserialization function
server.deserializeClient(function(id, callback) {
  AutoLoader.getModel(db.entities.client.model).forge()
  .where({
    id: id,
    enabled: true
  })
  .fetch({
    columns: ['id']
  })
  .then(function(client) {
    return client;
  })
  .nodeify(callback);
});

// Exchange credentials for authorization code (authorization code grant)
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, req, callback) {
  AutoLoader.getModel(db.entities.code.model).forge({
    code: uid(16),
    redirectUri: redirectUri,
    clientId: client.get('id'),
    userId: user.get('id')
  })
  .save()
  .then(function(code) {
    return code.get('code');
  })
  .nodeify(callback);
}));

// Exchange authorization code for access token (authorization code grant)
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, req, callback) {
  AutoLoader.getModel(db.entities.code.model).forge()
  .where({
    code: code
  })
  .fetch({
    columns: ['id', 'clientId', 'userId', 'redirectUri']
  })
  .bind({})
  .then(function(authCode) {
    this.authCode = authCode;
    if (!authCode) {
      throw new NotFoundError();
    }
    if (client.get('id').toString() != this.authCode.get('clientId')) {
      throw new NotFoundError();
    }
    if (redirectUri !== this.authCode.get('redirectUri')) {
      throw new NotFoundError();
    }
    return this.authCode.destroy();
  })
  .then(function(ret) {
    return createTokens(client, this.authCode.get('userId'), req);
  })
  .nodeify(function(err, token, refresh, expires) {
    if (!err) {
      callback(null, token, refresh, expires);
    }
    else if (err instanceof NotFoundError) {
      callback(null, false);
    }
    else {
      callback(err);
    }
  }, { spread: true });
}));

// Exchange credentials for access token (resource owner password credentials grant)
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, req, callback) {
  AutoLoader.getModel(db.entities.user.model).forge()
  .where({
    username: username,
    enabled: true
  })
  .fetch({
    columns: ['id', 'username', 'password']
  })
  .bind({})
  .then(function(user) {
    this.user = user;
    if (!user) {
      throw new NotFoundError();
    }
    return user.verifyPassword(password);
  })
  .then(function(isMatch) {
    if (!isMatch) {
      throw new NotFoundError();
    }
  })
  .then(function() {
    return createTokens(client, this.user.get('id'), req);
  })
  .nodeify(function(err, token, refresh, expires) {
    if (!err) {
      callback(null, token, refresh, expires);
    }
    else if (err instanceof NotFoundError) {
      callback(null, false);
    }
    else {
      callback(err);
    }
  }, { spread: true });
}));

// Exchange refresh token with new access token (refresh token grant)
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, callback) {
  if (config.oauth2.grants.indexOf('refresh_token') < 0) {
    throw new GrantTypeError();
  }
  AutoLoader.getModel(db.entities.token.model).forge()
  .where({
    refresh: refreshToken
  })
  .fetch({
    columns: ['id', 'userId', 'clientId', 'ipAddress', 'userAgent']
  })
  .bind({})
  .then(function(token) {
    this.token = token;
    if (!token) {
      throw new NotFoundError();
    }

    this.req = {};
    this.req['ipAddress_auto_generated'] = this.token.get('ipAddress');
    this.req['userAgent_auto_generated'] = this.token.get('userAgent');

    return AutoLoader.getModel(db.entities.user.model).forge()
      .where({
        id: this.token.get('userId'),
        enabled: true
      })
      .fetch({
        columns: ['id']
      });
  })
  .then(function(user) {
    this.user = user;
    if (!this.user) {
      throw new NotFoundError();
    }
    return this.token.destroy();
  })
  .then(function() {
    return createTokens(client, this.user.get('id'), this.req);
  })
  .nodeify(function(err, token, refresh, expires) {
    if (!err) {
      callback(null, token, refresh, expires);
    }
    else if (err instanceof NotFoundError) {
      callback(null, false);
    }
    else {
      callback(err);
    }
  }, { spread: true });
}));

// Exchange credentials for access token (client credentials grant)
server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, req, callback) {
  createTokens(client, null, req)
  .spread(function(token, refresh, expiration) {
    callback(null, token, refresh, expiration);
  })
  .catch(function(err) {
    if (err instanceof NotFoundError) {
      callback(null, false);
    }
    else {
      callback(err);
    }
  });
}));

//Delete all tokens associated to the user
var doLogout = function(req, res) {
  var token = headerHelper.getBearerToken(req);
  AutoLoader.getModel(db.entities.token.model).forge()
  .where({
    token: token
  })
  .fetch({
    columns: ['id', 'userId', 'clientId']
  })
  .then(function(token) {
    if (!token) {
      throw new NotFoundError();
    }
    return token.removeBy({
        userId: token.get('userId'),
        clientId: token.get('clientId')
      });
  })
  .then(function(ret) {
    handleSuccess(res, ret);
  })
  .catch(function(err) {
    handleError(res, err);
  });
}

// Create access token (jwt if enabled) and refresh token by client and user id
var createTokens = function(client, userId, req) {
  var ipAddress = (req !== null && req['ipAddress_auto_generated']) ? req['ipAddress_auto_generated'] : null;
  var userAgent = (req !== null && req['userAgent_auto_generated']) ? req['userAgent_auto_generated'] : null;

  return new Promise(function(resolve, reject) {
    createJwtToken(client, userId, ipAddress, userAgent)
    .bind({})
    .then(function(guid) {
      this.refreshToken = null;
      if (config.oauth2.grants.indexOf('refresh_token') >= 0) {
        this.refreshToken = uid(config.token.length);
      }

      return AutoLoader.getModel(db.entities.token.model).forge({
        token: guid,
        refresh: this.refreshToken,
        clientId: client.get('id'),
        userId: userId,
        ipAddress: ipAddress,
        userAgent: userAgent
      })
      .save();
    })
    .then(function(token) {
      var obj = [
        token.get('token'),
        { 'expires_in': config.token.life }
      ];
      if (this.refreshToken) {
        obj.push(this.refreshToken);
      }
      return resolve(obj);
    })
    .catch(function(err) {
      return reject(err);
    });
  });
}

// Create a JWT token
var createJwtToken = function(client, userId, ipAddress, userAgent) {
  return new Promise(function(resolve, reject) {
    try {
      if (config.token.jwt.enabled === false) {
        return resolve(uid(config.token.length));
      }

      var createdAt = Moment().unix();
      var token = null;

      var claim = {
        'iss': client.name,
        'sub': (userId !== null) ? userId : client.get('id'),
        'aud': client.get('domain'),
        'ipa': ipAddress,
        'bua': userAgent,
        'jti': uid(16),
        'iat': createdAt
      };

      if (config.token.jwt.cert !== null) {
        var cert = fs.readFileSync(config.token.jwt.cert);
        token = jwt.sign(
          claim,
          cert,
          { algorithm: config.token.jwt.algorithm, expiresIn: config.token.life }
        );
      }
      else {
        token = jwt.sign(
          claim,
          config.token.jwt.secretKey,
          { expiresIn: config.token.life }
        );
      }
      return resolve(token);
    }
    catch (err) {
      return reject(err);
    }
  });
}

// Create a random token
var uid = function(len) {
  return crypto.randomBytes(len).toString('hex');
}

//User authorization endpoint
exports.authorization = [
  server.authorization(function(clientId, redirectUri, callback) {
    AutoLoader.getModel(db.entities.client.model).forge()
    .where({
      name: clientId,
      enabled: true
    })
    .fetch({
      columns: ['id', 'name', 'description']
    })
    .then(function(client) {
      return [client, redirectUri];
    })
    .nodeify(callback, { spread: true });
  }),
  function(req, res) {
    res.render('dialog', {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client
    });
  }
];

//User decision endpoint
exports.decision = [
  server.decision()
];

//Token endpoint
exports.token = [
  server.token(),
  server.errorHandler()
];

//Logout endpoint
exports.logout = doLogout;
