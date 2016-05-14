var passport = require('passport');
var jwt = require('jsonwebtoken');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy;
var Promise = require('bluebird');
var headerHelper = require('../utils/headerParser');
var AutoLoader = require('../autoLoader');
var config = require('../configuration').getParams();
var NotFoundError = require('../exceptions/notFoundError');
var ExpiredTokenError = require('../exceptions/expiredTokenError');
var proxyMiddleware = require('../middlewares/proxy');

//Basic authentication
passport.use('basic', new BasicStrategy(
  function(username, password, callback) {
    if (config.oauth2.authentications.indexOf('basic') < 0) {
      return callback(null, false);
    }
    AutoLoader.getModel('User').forge()
    .where({
      username: username,
      enabled: true
    })
    .fetch({
      columns: ['id', 'username', 'email', 'firstName', 'lastName', 'password']
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
      return this.user;
    })
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
      return callback(null, false);
    }
    AutoLoader.getModel('Client').forge()
    .where({
      name: clientId,
      enabled: true
    })
    .fetch({
      columns: ['id', 'name', 'secret', 'description', 'domain']
    })
    .bind({})
    .then(function(client) {
      this.client = client;
      if (!client) {
        return false;
      }
      return client.verifySecret(clientSecret);
    })
    .then(function(isMatch) {
      if (!isMatch) {
        return false;
      }
      return this.client;
    })
    .nodeify(callback);
  }
));

//Client authentication with credentials into body
passport.use('password', new ClientPasswordStrategy(
  function(clientId, clientSecret, callback) {
    if (config.oauth2.grants.indexOf('password') < 0) {
      return callback(null, false);
    }
    AutoLoader.getModel('Client').forge().where({
      name: clientId,
      enabled: true
    })
    .fetch({
      columns: ['id', 'name', 'secret', 'description', 'domain']
    })
    .bind({})
    .then(function(client) {
      this.client = client;
      if (!client) {
        return false;
      }
      return client.verifySecret(clientSecret);
    })
    .then(function(isMatch) {
      if (!isMatch) {
        return false;
      }
      return this.client;
    })
    .nodeify(callback);
  }
));

//Bearer authentication
passport.use('bearer', new BearerStrategy({ passReqToCallback: true },
  function(req, accessToken, callback) {
    if (config.oauth2.authentications.indexOf('bearer') < 0) {
      return callback(null, false);
    }
    AutoLoader.getModel('Token').forge()
    .where({
      token: accessToken
    })
    .fetch({
      columns: ['id', 'token', 'refresh', 'userId', 'clientId', 'createdAt']
    })
    .bind({})
    .then(function(token) {
      this.token = token;
      if (!token) {
        throw new NotFoundError();
      }
      // Check token expiration if it isn't a jwt
      if (config.token.jwt.enabled === false && Math.round((Date.now() - this.token.get('createdAt')) / 1000) > config.token.life) {
        return false;
      }
      // Check jwt token
      if (config.token.jwt.enabled === true) {
        return verifyJwtToken(req, token);
      }
      return true;
    })
    .then(function(isValidToken) {
      if (isValidToken === false) {
        return this.token.destroy()
          .then(function() {
            throw new ExpiredTokenError();
          });
      }
      return isValidToken;
    })
    .then(function(ret) {
      if (this.token.get('userId') != null) {
        return AutoLoader.getModel('User').forge()
          .where({
            id: this.token.get('userId'),
            enabled: true
          })
          .fetch({
            columns: ['id', 'username', 'password']
          });
      }
      else {
        return AutoLoader.getModel('Client').forge()
          .where({
            id: this.token.get('clientId'),
            enabled: true
          })
          .fetch({
            columns: ['id']
          });
      }
    })
    .then(function(ret) {
      if (!ret) {
        throw new NotFoundError();
      }
      return ret;
    })
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

//Verify if JWT is valid
var verifyJwtToken = function (req, token) {
  return new Promise(function(resolve, reject) {
    var secret = config.token.jwt.secretKey;
    if (config.token.jwt.cert !== null) {
      secret = fs.readFileSync(config.token.jwt.cert);
    }
    return jwt.verify(token.get('token'), secret, { ignoreExpiration: false }, function(err, decoded) {
      if (!err) {
        var ipAddress = headerHelper.getIP(req);
        var userAgent = headerHelper.getUA(req);

        if ((config.token.jwt.uacheck === false || decoded.bua === null || decoded.bua === userAgent) && (config.token.jwt.ipcheck === false || decoded.ipa === ipAddress)) {
          return resolve(true);
        }
        return reject(new NotFoundError());
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
