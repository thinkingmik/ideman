var util = require('util');
var Promise = require('bluebird');
var crypto = require('crypto');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));
var config = require('../configuration').getParams();
var CryptHashError = require('../exceptions/cryptHashError');
var CipherHashError = require('../exceptions/cipherHashError');

/**
* Cipher a text with crypto. The operation is reversible
* @param {string} text
* @return {Promise<string>}
* @throws CipherHashError
*/
var cipherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var cipher = crypto.createCipher(config.crypto.algorithm, config.crypto.secretKey);
      var crypted = cipher.update(text, config.crypto.inputEncoding, config.crypto.outputEncoding);
      crypted += cipher.final(config.crypto.outputEncoding);

      return resolve(crypted);
    }
    catch (err) {
      return reject(new CipherHashError(util.format('Error while generating crypto hash. %s', err.message)));
    }
  });
}

/**
* Decipher a ciphered text with crypto
* @param {string} text
* @return {Promise<string>}
* @throws CipherHashError
*/
var decipherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var decipher = crypto.createDecipher(config.crypto.algorithm, config.crypto.secretKey);
      var decrypted = decipher.update(text, config.crypto.outputEncoding, config.crypto.inputEncoding);
      decrypted += decipher.final(config.crypto.inputEncoding);

      return resolve(decrypted);
    }
    catch (err) {
      return reject(new CipherHashError(util.format('Error while deciphering crypto hash. %s', err.message)));
    }
  });
}

/**
* Check if the clear text matches with the ciphered text. If force is specified
* it accepts two ciphered strings to compare
* @param {string} text
* @param {string} ciphered
* @param {bool} force
* @return {Promise<bool>}
* @throws CipherHashError
*/
var compareText = function(text, cipher, force) {
  return new Promise(function(resolve, reject) {
    var promise = Promise.resolve(text);
    if (force === true) {
      promise = decipherText(text)
      .then(function(dec) {
        return dec;
      })
      .catch(function(err) {
        return text;
      });
    }

    return promise.
    then(function(text) {
      return cipherText(text);
    })
    .then(function(hash) {
      if (hash === cipher) {
        return resolve(true);
      }
      return resolve(false);
    })
    .catch(function(err) {
      return reject(new CipherHashError(util.format('Not a valid crypto hash. %s', err.message)));
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
module.exports.cipher = cipherText;
module.exports.decipher = decipherText;
module.exports.compare = compareText;
module.exports.crypt = cryptText;
module.exports.verify = verifyText;
