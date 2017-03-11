var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var ideman = require('./server/ideman');
var Promise = require('bluebird');

var username = 'administrator';
var password = 'Password1.';
var clientId = 'acme';
var clientSecret = 'Password1.';
var Client = ideman.getModel('Client').forge({
  name: clientId,
  secret: clientSecret
});
var accessToken = '';
var clientAccessToken = '';
var refreshToken = '';

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
