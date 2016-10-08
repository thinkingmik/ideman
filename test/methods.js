var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var ideman = require('./server/ideman');
var Promise = require('bluebird');

var username = 'administrator';
var password = 'Password1.';
var clientId = 'acme01';
var clientSecret = 'Password2.';
var Client = ideman.getModel('Client').forge({
  name: clientId,
  secret: clientSecret
});
var accessToken = '';
var clientAccessToken = '';
var refreshToken = '';
var text = 'example';
var cyphered = null;
var crypted = null;

// Cypher method
describe('Call cypher method', function() {
  it('should return a cyphered text', function() {
    return ideman.cypher(text)
    .then(function(res) {
      cyphered = res;
      expect(res).to.exist;
    });
  });
  it('should return a CypherHashError exception', function() {
    return ideman.cypher(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Decypher method
describe('Call decypher method', function() {
  it('should return a decyphered text', function() {
    return ideman.decypher(cyphered)
    .then(function(res) {
      expect(res).to.be.equal(text);
    });
  });
  it('should return a CypherHashError exception', function() {
    return ideman.decypher(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Compare method
describe('Call compare method', function() {
  it('should return a true value', function() {
    return ideman.compare(text, cyphered)
    .then(function(res) {
      expect(res).to.be.equal(true);
    });
  });
  it('should return a false value', function() {
    return ideman.compare('fake', cyphered)
    .then(function(res) {
      expect(res).to.be.equal(false);
    });
  });
  it('should return a CypherHashError exception', function() {
    return ideman.compare(null, cyphered)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Crypt method
describe('Call crypt method', function() {
  it('should return a crypted text', function() {
    return ideman.crypt(text)
    .then(function(res) {
      crypted = res;
      expect(res).to.exist;
    });
  });
  it('should return a CryptHashError exception', function() {
    return ideman.crypt(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CryptHashError');
    });
  });
});

// Verify method
describe('Call verify method', function() {
  it('should return a true value', function() {
    return ideman.verify(text, crypted)
    .then(function(res) {
      expect(res).to.be.equal(true);
    });
  });
  it('should return a false value', function() {
    return ideman.verify('fake', crypted)
    .then(function(res) {
      expect(res).to.be.equal(false);
    });
  });
  it('should return a CryptHashError exception', function() {
    return ideman.verify(null, cyphered)
    .catch(function(err) {
      expect(err.name).to.be.equal('CryptHashError');
    });
  });
});

// Exchange password method
describe('Call exchange password method', function() {
  it('should return an access token', function() {
    return ideman.exchangePassword(Client, username, password)
    .then(function(res) {
      expect(res).to.have.property('access_token');
      expect(res).to.have.property('refresh_token');
      expect(res).to.have.property('expires_in');
      expect(res).to.have.property('token_type');
      accessToken = res.access_token;
      refreshToken = res.refresh_token;
    });
  });
  it('should return a AuthGrantError exception', function() {
    return ideman.exchangePassword(Client, 'fake', password)
    .catch(function(err) {
      expect(err.name).to.be.equal('AuthGrantError');
    });
  });
});

// Revoke method
describe('Call revoke token method', function() {
  it('should return a success message', function() {
    return ideman.revokeToken(accessToken)
    .then(function(res) {
      expect(res).to.be.equal(true);
    });
  });
});
