var _ = require('lodash');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy;
var Promise = require('bluebird');
var headerHelper = require('../utils/headerParser');
var AutoLoader = require('../autoLoader');
var config = require('../configuration').getParams();
var db = require('../database').getParams();
var GrantTypeError = require('../exceptions/grantTypeError');
var NotFoundError = require('../exceptions/notFoundError');
var ExpiredTokenError = require('../exceptions/expiredTokenError');
var proxyMiddleware = require('../middlewares/proxy');
var ldapManager = require('../utils/ldapManager');

//Basic authentication
passport.use('basic', new BasicStrategy(
  function(username, password, callback) {
    if (config.oauth2.authentications.indexOf('basic') < 0) {
      throw new GrantTypeError();
    }
    validateUserCredentials(username, password)
    .nodeify(function(err, result) {
      if (!err) {
        return callback(null, result);
      }
      else if (err instanceof NotFoundError) {
        return callback(null, false);
      }
      else {
        return callback(err);
      }
    });
  }
));

//Client authentication with credentials into header
passport.use('client_credentials', new BasicStrategy(
  function(clientId, clientSecret, callback) {
    if (config.oauth2.grants.indexOf('client_credentials') < 0) {
      throw new GrantTypeError();
    }
    validateClientCredentials(clientId, clientSecret)
    .nodeify(function(err, result) {
      if (!err) {
        return callback(null, result);
      }
      else if (err instanceof NotFoundError) {
        return callback(null, false);
      }
      else {
        return callback(err);
      }
    });
  }
));

//Client authentication with credentials into body
passport.use('password', new ClientPasswordStrategy(
  function(clientId, clientSecret, callback) {
    if (config.oauth2.grants.indexOf('password') < 0) {
      throw new GrantTypeError();
    }
    validateClientCredentials(clientId, clientSecret)
    .nodeify(function(err, result) {
      if (!err) {
        return callback(null, result);
      }
      else if (err instanceof NotFoundError) {
        return callback(null, false);
      }
      else {
        return callback(err);
      }
    });
  }
));

//Bearer authentication
passport.use('bearer', new BearerStrategy({ passReqToCallback: true },
  function(req, accessToken, callback) {
    if (config.oauth2.authentications.indexOf('bearer') < 0) {
      throw new GrantTypeError();
    }
    var ipAddress = headerHelper.getIP(req);
    var userAgent = headerHelper.getUA(req);
    validateBearerToken(accessToken, ipAddress, userAgent)
    .nodeify(function(err, result) {
      if (!err) {
        return callback(null, result, { scope: '*' });
      }
      else if (err instanceof NotFoundError) {
        return callback(null, false);
      }
      else {
        return callback(err);
      }
    });
  }
));

//Public method for client validation
var validateClientCredentials = function (name, secret) {
  return AutoLoader.getModel(db.entities.client.model).forge()
  .where({
    name: name,
    enabled: true
  })
  .fetch()
  .bind({})
  .then(function(client) {
    this.client = client;
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    return client.verifySecret(secret);
  })
  .then(function(isMatch) {
    if (!isMatch) {
      throw new NotFoundError('Client not found');
    }
    return this.client;
  })
  .catch(function(err) {
    throw err;
  });
}

//Public method for user validation
var validateUserCredentials = function (username, password) {
  var ldapPromise = Promise.resolve(true);

  if (config.ldap.enabled === true) {
    ldapPromise = ldapManager.ldapAuthentication(username, password);
  }

  return ldapPromise.then(function (res) {
    if (_.isNull(res)) {
      throw new NotFoundError('User not found');
    }

    return AutoLoader.getModel(db.entities.user.model).forge()
    .where({
      username: (config.ldap.enabled === true) ? res : username,
      enabled: true
    })
    .fetch();
  })
  .bind({})
  .then(function(user) {
    this.user = user;
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (config.ldap.enabled === true) {
      return true;
    }
    return user.verifyPassword(password);
  })
  .then(function(isMatch) {
    if (!isMatch) {
      throw new NotFoundError('User not found');
    }
    return this.user;
  })
  .catch(function(err) {
    throw err;
  });
}

//Public method for token validation
var validateBearerToken = function (token, ipAddress, userAgent) {
  return AutoLoader.getModel(db.entities.token.model).forge()
  .where({
    token: token
  })
  .fetch({
    columns: ['id', 'token', 'refresh', 'userId', 'clientId', 'createdAt']
  })
  .bind({})
  .then(function(token) {
    this.token = token;
    if (!token) {
      throw new NotFoundError('Token not found');
    }
    // Check token expiration if it isn't a jwt
    if (config.token.jwt.enabled === false && Math.round((Date.now() - this.token.get('createdAt')) / 1000) > config.token.life) {
      return false;
    }
    // Check jwt token
    if (config.token.jwt.enabled === true) {
      return verifyJwtToken(token, ipAddress, userAgent);
    }
    return true;
  })
  .then(function(isValidToken) {
    if (isValidToken === false) {
      throw new ExpiredTokenError('Token expired or not valid');
    }
    return isValidToken;
  })
  .then(function(ret) {
    if (this.token.get('userId') != null) {
      return AutoLoader.getModel(db.entities.user.model).forge()
      .where({
        id: this.token.get('userId'),
        enabled: true
      }).fetch();
    }
    else {
      return AutoLoader.getModel(db.entities.client.model).forge()
      .where({
        id: this.token.get('clientId'),
        enabled: true
      }).fetch();
    }
  })
  .then(function(ret) {
    if (!ret) {
      throw new NotFoundError('User or client not found');
    }
    return ret;
  })
  .catch(function(err) {
    throw err;
  });
}

//Verify if JWT is valid
var verifyJwtToken = function (token, ipAddress, userAgent) {
  var secret = config.token.jwt.secretKey;
  if (config.token.jwt.cert !== null) {
    secret = fs.readFileSync(config.token.jwt.cert);
  }
  return new Promise(function(resolve, reject) {
    jwt.verify(token.get('token'), secret, { ignoreExpiration: false }, function(err, decoded) {
      if (!err) {
        if ((config.token.jwt.uacheck === false || decoded.bua === null || decoded.bua === userAgent) && (config.token.jwt.ipcheck === false || decoded.ipa === ipAddress)) {
          return resolve(true);
        }
        return reject(new NotFoundError('Token not valid'));
      }
      else if (err.name && err.name === 'TokenExpiredError') {
        return resolve(false);
      }
      else {
        return reject(err);
      }
    });
  });
}

//Export endpoints
exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false });
exports.isClientAuthenticated = [
  proxyMiddleware.fillClientCredentials,
  passport.authenticate(['client_credentials', 'password'], { session: false })
];

//Public methods
exports.validateUserCredentials = validateUserCredentials;
exports.validateClientCredentials = validateClientCredentials;
exports.validateBearerToken = validateBearerToken;
