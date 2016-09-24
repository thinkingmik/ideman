var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var ideman = require('./server/ideman');

var username = 'administrator';
var password = 'Password1.';
var clientId = 'acme01';
var clientSecret = 'Password2.';
var accessToken = '';
var clientAccessToken = '';
var refreshToken = '';
var text = 'example';
var cyphered = null;
var crypted = null;

// Exchange password method
describe('Call exchange password method', function() {
  it('should return an access token', function() {
    ideman.exchangePassword(clientId, username, password)
    .then(function(res) {
      expect(res).to.have.property('access_token');
      expect(res).to.have.property('refresh_token');
      expect(res).to.have.property('expires_in');
      expect(res).to.have.property('token_type');
      accessToken = res.access_token;
      refreshToken = res.refresh_token;
    });
  });
});

// Cypher method
describe('Call cypher method', function() {
  it('should return a cyphered text', function() {
    ideman.cypher(text)
    .then(function(res) {
      cyphered = res;
      expect(res).to.exist;
    });
  });
  it('should return a CypherHashError exception', function() {
    ideman.cypher(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Decypher method
describe('Call decypher method', function() {
  it('should return a decyphered text', function() {
    ideman.decypher(cyphered)
    .then(function(res) {
      expect(res).to.be.equal(text);
    });
  });
  it('should return a CypherHashError exception', function() {
    ideman.decypher(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Compare method
describe('Call compare method', function() {
  it('should return a true value', function() {
    ideman.compare(text, cyphered)
    .then(function(res) {
      expect(res).to.be.equal(true);
    });
  });
  it('should return a false value', function() {
    ideman.compare('fake', cyphered)
    .then(function(res) {
      expect(res).to.be.equal(false);
    });
  });
  it('should return a CypherHashError exception', function() {
    ideman.compare(null, cyphered)
    .catch(function(err) {
      expect(err.name).to.be.equal('CypherHashError');
    });
  });
});

// Crypt method
describe('Call crypt method', function() {
  it('should return a crypted text', function() {
    ideman.crypt(text)
    .then(function(res) {
      crypted = res;
      expect(res).to.exist;
    });
  });
  it('should return a CryptHashError exception', function() {
    ideman.crypt(null)
    .catch(function(err) {
      expect(err.name).to.be.equal('CryptHashError');
    });
  });
});

// Verify method
describe('Call verify method', function() {
  it('should return a true value', function() {
    ideman.verify(text, crypted)
    .then(function(res) {
      expect(res).to.be.equal(true);
    });
  });
  it('should return a false value', function() {
    ideman.verify('fake', crypted)
    .then(function(res) {
      expect(res).to.be.equal(false);
    });
  });
  it('should return a CryptHashError exception', function() {
    ideman.verify(null, cyphered)
    .catch(function(err) {
      expect(err.name).to.be.equal('CryptHashError');
    });
  });
});
