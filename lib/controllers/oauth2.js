var _ = require('lodash');
var oauth2orize = require('oauth2orize');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var validator = require('../utils/paramChecker');
var Moment = require('moment');
var Promise = require('bluebird');
var AutoLoader = require('../autoLoader');
var headerHelper = require('../utils/headerParser');
var consts = require('../constants');
var config = require('../configuration').getParams();
var db = require('../database').getParams();
var NotFoundError = require('../exceptions/notFoundError');
var AuthGrantError = require('../exceptions/authGrantError');
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
  if (config.oauth2.grants.indexOf('authorization_code') < 0) {
    throw new GrantTypeError();
  }
  grantCode(client, user, redirectUri)
  .then(function(code) {
    return code.get('code');
  })
  .nodeify(callback);
}));

// Exchange authorization code for access token (authorization code grant)
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, req, callback) {
  if (config.oauth2.grants.indexOf('authorization_code') < 0) {
    throw new GrantTypeError();
  }
  exchangeCode(client, code, redirectUri, req['ipAddress_auto_generated'], req['userAgent_auto_generated'])
  .then(function(ret) {
    var obj = [];
    obj.push(ret.access_token);
    if (ret.refresh_token) {
      obj.push(ret.refresh_token);
    }
    else {
      obj.push(null);
    }
    obj.push({ 'expires_in': ret.expires_in });
    return obj;
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
  exchangePassword(client, username, password, req['ipAddress_auto_generated'], req['userAgent_auto_generated'])
  .then(function(ret) {
    var obj = [];
    obj.push(ret.access_token);
    if (ret.refresh_token) {
      obj.push(ret.refresh_token);
    }
    else {
      obj.push(null);
    }
    obj.push({ 'expires_in': ret.expires_in });
    return obj;
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
  exchangeRefreshToken(client, refreshToken)
  .then(function(ret) {
    var obj = [];
    obj.push(ret.access_token);
    if (ret.refresh_token) {
      obj.push(ret.refresh_token);
    }
    else {
      obj.push(null);
    }
    obj.push({ 'expires_in': ret.expires_in });
    return obj;
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
  exchangeClientCredentials(client, req['ipAddress_auto_generated'], req['userAgent_auto_generated'])
  .then(function(ret) {
    var obj = [];
    obj.push(ret.access_token);
    if (ret.refresh_token) {
      obj.push(ret.refresh_token);
    }
    else {
      obj.push(null);
    }
    obj.push({ 'expires_in': ret.expires_in });
    return obj;
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

// Delete all tokens associated to the user
var doLogout = function(req, res) {
  var token = headerHelper.getBearerToken(req);
  var all = req.body['force'];

  try {
    all = validator.sanitizeParam(consts.validation.types.boolean, all, true);
  }
  catch (err) {
    return handleError(res, err);
  }

  return revokeToken(token, all)
  .then(function(ret) {
    return handleSuccess(res, ret);
  })
  .catch(function(err) {
    return handleError(res, err);
  });
}

// Create access token (jwt if enabled) and refresh token by client and user id
var createTokens = function(client, userId, req, tokens) {
  var promise = Promise.resolve(true);
  var ipAddress = (!_.isNull(req['ipAddress_auto_generated']) && !_.isUndefined(req['ipAddress_auto_generated'])) ? req['ipAddress_auto_generated'] : null;
  var userAgent = (!_.isNull(req['userAgent_auto_generated']) && !_.isUndefined(req['userAgent_auto_generated'])) ? req['userAgent_auto_generated'] : null;

  return AutoLoader.getBookshelf().transaction(function (tnx) {
    if (!_.isUndefined(tokens) && !_.isNull(tokens)) {
      promise = AutoLoader.getModel(db.entities.token.model).forge()
      .query(function(qb) {
        if (_.isArray(tokens.models)) {
          var ids = [];
          _.each(tokens.models, function(token) {
            ids.push(token.get('id'));
          });
          qb.where('id', 'in', ids);
        }
        else {
          qb.where('id', tokens.get('id'));
        }
      })
      .destroy({ transacting: tnx });
    }

    promise.then(function(ret) {
      return createJwtToken(client, userId, ipAddress, userAgent);
    })
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
      .save(null, { transacting: tnx });
    })
    .then(function(token) {
      var obj = {};
      obj['token_type'] = 'Bearer';
      obj['access_token'] = token.get('token');
      obj['expires_in'] = config.token.life;
      if (this.refreshToken) {
        obj['refresh_token'] = this.refreshToken;
      }
      return obj;
    })
    .then(tnx.commit)
    .catch(tnx.rollback);
  })
  .then(function (obj) {
    return Promise.resolve(obj);
  })
  .catch(function (err) {
    return Promise.reject(err);
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
        'iss': client.get('name'),
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

// Public method for password exchange
var exchangePassword = function (client, username, password, ip, userAgent) {
  var req = {};
  req['ipAddress_auto_generated'] = ip;
  req['userAgent_auto_generated'] = userAgent;

  return AutoLoader.getModel(db.entities.user.model).forge()
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
      throw new NotFoundError('User not found');
    }
    return user.verifyPassword(password);
  })
  .then(function(isMatch) {
    if (!isMatch) {
      throw new NotFoundError('User not found');
    }
    if (config.token.autoRemove === true) {
      return AutoLoader.getModel(db.entities.token.model).forge()
      .where({
        userId: this.user.get('id')
      })
      .fetchAll({
        columns: ['id']
      });
    }
    return null;
  })
  .then(function(tokens) {
    return Promise.resolve(createTokens(client, this.user.get('id'), req, tokens));
  })
  .catch(function(err) {
    return Promise.reject(new AuthGrantError(err.message));
  });
}

// Public method for client credentials exchange
var exchangeClientCredentials = function (client, ip, userAgent) {
  var promise = Promise.resolve(null);
  var req = {};
  req['ipAddress_auto_generated'] = ip;
  req['userAgent_auto_generated'] = userAgent;

  if (config.token.autoRemove === true) {
    promise = AutoLoader.getModel(db.entities.token.model).forge()
    .where({
      clientId: client.get('id')
    })
    .fetchAll({
      columns: ['id']
    });
  }

  return promise.then(function(tokens) {
    return createTokens(client, null, req, tokens);
  });
}

// Public method for refresh token exchange
var exchangeRefreshToken = function (client, refreshToken) {
  return AutoLoader.getModel(db.entities.token.model).forge()
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
      throw new NotFoundError('Token not found');
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
      throw new NotFoundError('User not found');
    }
    return this.token;
  })
  .then(function(token) {
    return Promise.resolve(createTokens(client, this.user.get('id'), this.req, token));
  })
  .catch(function(err) {
    return Promise.reject(err);
  });
}

// Public methods for grant code
var grantCode = function(client, user, redirectUri) {
  return AutoLoader.getModel(db.entities.code.model).forge({
    code: uid(16),
    redirectUri: redirectUri,
    clientId: client.get('id'),
    userId: user.get('id')
  })
  .save()
  .then(function(code) {
    return Promise.resolve(code);
  })
  .catch(function(err) {
    return Promise.reject(err);
  });
}

// Public method for code exchange
var exchangeCode = function(client, code, redirectUri, ip, userAgent) {
  var req = {};
  req['ipAddress_auto_generated'] = ip;
  req['userAgent_auto_generated'] = userAgent;

  return AutoLoader.getModel(db.entities.code.model).forge()
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
      throw new NotFoundError('Code not found');
    }
    if (client.get('id').toString() != this.authCode.get('clientId')) {
      throw new NotFoundError('Client not found');
    }
    if (redirectUri !== this.authCode.get('redirectUri')) {
      throw new NotFoundError('Redirect url not found');
    }
    return this.authCode;
  })
  .then(function(code) {
    return Promise.resolve(createTokens(client, this.authCode.get('userId'), req, code));
  })
  .catch(function(err) {
    return Promise.reject(err);
  });
}

// Public method for logout
var revokeToken = function(tokenId, all) {
  return AutoLoader.getModel(db.entities.token.model).forge()
  .where({
    token: tokenId
  })
  .fetch({
    columns: ['id', 'userId', 'clientId']
  })
  .then(function(token) {
    if (!token) {
      throw new NotFoundError('Token not found');
    }

    var whereClause = { id: token.get('id') };
    if (all === true) {
      whereClause = { userId: token.get('userId'), clientId: token.get('clientId') };
    }

    return AutoLoader.getModel(db.entities.token.model).forge()
    .where(whereClause)
    .destroy();
  })
  .then(function(ret) {
    return Promise.resolve(true);
  })
  .catch(function(err) {
    return Promise.reject(err);
  });
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
    res.render(config.dialog.page, {
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

//Public methods
exports.exchangePassword = exchangePassword;
exports.exchangeClientCredentials = exchangeClientCredentials;
exports.exchangeRefreshToken = exchangeRefreshToken;
exports.exchangeCode = exchangeCode;
exports.grantCode = grantCode;
exports.revokeToken = revokeToken;
