var util = require('util');
var Promise = require('bluebird');
var crypto = require('crypto');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));
var config = require('../configuration').getParams();
var CryptHashError = require('../exceptions/cryptHashError');
var CypherHashError = require('../exceptions/cypherHashError');

/**
* Cypher a text with crypto. The operation is reversible
* @param {string} text
* @return {Promise<string>}
* @throws CypherHashError
*/
var cypherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var cipher = crypto.createCipher(config.crypto.algorithm, config.crypto.secretKey);
      var crypted = cipher.update(text, config.crypto.inputEncoding, config.crypto.outputEncoding);
      crypted += cipher.final(config.crypto.outputEncoding);

      return resolve(crypted);
    }
    catch (err) {
      return reject(new CypherHashError(util.format('Error while generating crypto hash. %s', err.message)));
    }
  });
}

/**
* Decypher a cyphered text with crypto
* @param {string} text
* @return {Promise<string>}
* @throws CypherHashError
*/
var decypherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var decipher = crypto.createDecipher(config.crypto.algorithm, config.crypto.secretKey);
      var decrypted = decipher.update(text, config.crypto.outputEncoding, config.crypto.inputEncoding);
      decrypted += decipher.final(config.crypto.inputEncoding);

      return resolve(decrypted);
    }
    catch (err) {
      return reject(new CypherHashError(util.format('Error while decyphering crypto hash. %s', err.message)));
    }
  });
}

/**
* Check if the clear text matches with the cyphered text. If force is specified
* it accepts two cyphered strings to compare
* @param {string} text
* @param {string} cyphered
* @param {bool} force
* @return {Promise<bool>}
* @throws CypherHashError
*/
var compareText = function(text, cypher, force) {
  return new Promise(function(resolve, reject) {
    var promise = Promise.resolve(text);
    if (force === true) {
      promise = decypherText(text)
      .then(function(dec) {
        return dec;
      })
      .catch(function(err) {
        return text;
      });
    }

    return promise.
    then(function(text) {
      return cypherText(text);
    })
    .then(function(hash) {
      if (hash === cypher) {
        return resolve(true);
      }
      return resolve(false);
    })
    .catch(function(err) {
      return reject(new CypherHashError(util.format('Not a valid crypto hash. %s', err.message)));
    });
  });
}

/**
* Crypt a text with bcrypt. The operation is not reversible
* @param {string} text
* @return {Promise<string>}
* @throws CryptHashError
*/
var cryptText = function(text) {
  return bcrypt.genSaltAsync(5)
  .then(function (salt) {
    return bcrypt.hashAsync(text, salt, null);
  })
  .then(function (hash) {
    return hash;
  })
  .catch(function(err) {
    throw new CryptHashError(util.format('Error while generating bcrypt hash. %s', err.message));
  });
}

/**
* Check if the clear text matches with the crypted text
* @param {string} text
* @param {string} crypted
* @return {Promise<bool>}
* @throws CryptHashError
*/
var verifyText = function(text, crypted) {
  return bcrypt.compareAsync(text, crypted)
  .catch(function(err) {
    throw new CryptHashError(util.format('Not a valid bcrypt hash. %s', err.message));
  });
}

/* Public methods */
module.exports.cypher = cypherText;
module.exports.decypher = decypherText;
module.exports.compare = compareText;
module.exports.crypt = cryptText;
module.exports.verify = verifyText;
