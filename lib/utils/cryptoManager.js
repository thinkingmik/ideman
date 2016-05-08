var Promise = require('bluebird');
var crypto = require('crypto');
var config = require('../config');

var cypherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var cipher = crypto.createCipher(config.crypto.algorithm, config.crypto.secretKey);
      var crypted = cipher.update(text, config.crypto.inputEncoding, config.crypto.outputEncoding);
      crypted += cipher.final(config.crypto.outputEncoding);

      return resolve(crypted);
    }
    catch (err) {
      return reject(err);
    }
  });
}

var decypherText = function(text) {
  return new Promise(function(resolve, reject) {
    try {
      var decipher = crypto.createDecipher(config.crypto.algorithm, config.crypto.secretKey);
      var decrypted = decipher.update(text, config.crypto.outputEncoding, config.crypto.inputEncoding);
      decrypted += decipher.final(config.crypto.inputEncoding);

      return resolve(decrypted);
    }
    catch (err) {
      return reject(err);
    }
  });
}

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
        return reject(err);
      });
  });
}

module.exports.cypher = cypherText;
module.exports.decypher = decypherText;
module.exports.compare = compareText;
