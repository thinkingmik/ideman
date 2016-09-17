var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var supertest = require('supertest');
var api = supertest('http://localhost:3000');

var username = 'administrator';
var password = 'Password1.';
var clientId = 'acme01';
var clientSecret = 'Password2.';

var tokenEndpoint = '/oauth2/token';
var logoutEndpoint = '/oauth2/logout';
var resourceEndpoint = '/resource';
var authorizeEndpoint = '/oauth2/authorize';
var accessToken = '';
var refreshToken = '';
var transactionId = '';
var code = '';
var cookie = null;

// OAuth2 client credentials grant
describe('Do a client credentials authentication', function() {
  it('should return an unsupported grant type', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'fake',
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(501)
      .end(done);
  });
  it('should return an unauthorized code', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, 'fake')
      .send({
        grant_type: 'client_credentials',
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(401)
      .end(done);
  });
  it('should return an access token (with basic authentication)', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'client_credentials',
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        expect(res.body).to.have.property('access_token');
        expect(res.body).to.have.property('refresh_token');
        expect(res.body).to.have.property('expires_in');
        expect(res.body).to.have.property('token_type');
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(done);
  });
  it('should return an access token', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        expect(res.body).to.have.property('access_token');
        expect(res.body).to.have.property('refresh_token');
        expect(res.body).to.have.property('expires_in');
        expect(res.body).to.have.property('token_type');
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(done);
  });
  it('should return a success message', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer ' + accessToken)
      .expect(200)
      .end(done);
  });
  it('should return an invalid access token error', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer fake')
      .expect(401)
      .end(done);
  });
});

// OAuth2 resource owner password credentials grant with proxy
describe('Do a user credentials authentication (behind proxy, no client secret)', function() {
  it('should return an unsupported grant type', function(done) {
    api.post(tokenEndpoint)
      .send({
        grant_type: 'password_fake',
        client_id: clientId,
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(501)
      .end(done);
  });
  it('should return an unauthorized code', function(done) {
    api.post(tokenEndpoint)
      .send({
        grant_type: 'password',
        client_id: 'fake',
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(401)
      .end(done);
  });
  it('should return an access token', function(done) {
    api.post(tokenEndpoint)
      .send({
        grant_type: 'password',
        client_id: clientId,
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        expect(res.body).to.have.property('access_token');
        expect(res.body).to.have.property('refresh_token');
        expect(res.body).to.have.property('expires_in');
        expect(res.body).to.have.property('token_type');
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(done);
  });
  it('should return a success message', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer ' + accessToken)
      .expect(200)
      .end(done);
  });
  it('should return an invalid access token error', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer fake')
      .expect(401)
      .end(done);
  });
});

// OAuth2 resource owner password credentials grant
describe('Do a user credentials authentication', function() {
  it('should return an unsupported grant type', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'password_fake',
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(501)
      .end(done);
  });
  it('should return an unauthorized code', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, 'client1234')
      .send({
        grant_type: 'password',
        username: username,
        password: password + '2',
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(401)
      .end(done);
  });
  it('should return an access token (with basic authentication)', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'password',
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        expect(res.body).to.have.property('access_token');
        expect(res.body).to.have.property('refresh_token');
        expect(res.body).to.have.property('expires_in');
        expect(res.body).to.have.property('token_type');
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(done);
  });
  it('should return an access token', function(done) {
    api.post(tokenEndpoint)
      .send({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        expect(res.body).to.have.property('access_token');
        expect(res.body).to.have.property('refresh_token');
        expect(res.body).to.have.property('expires_in');
        expect(res.body).to.have.property('token_type');
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(done);
  });
  it('should return a success message', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer ' + accessToken)
      .expect(200)
      .end(done);
  });
  it('should return an invalid access token error', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer fake')
      .expect(401)
      .end(done);
  });
});

// OAuth2 refresh token grant
describe('Refreshing an access token', function() {
  it('should return a new access token', function(done) {
    api.post(tokenEndpoint)
      .send({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        scope: '*'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(200)
      .expect(function(res) {
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
      })
      .end(function(err, res) {
        api.post(tokenEndpoint)
          .auth(clientId, clientSecret)
          .send({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
          .set('Accept', 'application/x-www-form-urlencoded')
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.have.property('access_token');
            expect(res.body).to.have.property('refresh_token');
            expect(res.body).to.have.property('expires_in');
            expect(res.body).to.have.property('token_type');
            accessToken = res.body.access_token;
            refreshToken = res.body.refresh_token;
          })
          .end(done);
      });
  });
  it('should return a success message', function(done) {
    api.get(resourceEndpoint)
      .set('Authorization', 'bearer ' + accessToken)
      .expect(200)
      .end(done);
  });
  it('should return an invalid refresh token error', function(done) {
    api.post(tokenEndpoint)
      .auth(clientId, clientSecret)
      .send({
        grant_type: 'refresh_token',
        refresh_token: 'fake'
      })
      .set('Accept', 'application/x-www-form-urlencoded')
      .expect(403)
      .end(done);
  });
});

// Basic authentication
describe('Do a basic authentication', function() {
  it('should return a success message', function(done) {
    api.get(resourceEndpoint)
      .auth(username, password)
      .expect(200)
      .end(done);
  });
  it('should return an unauthorized code', function(done) {
    api.get(resourceEndpoint)
      .auth(username, 'Password11.')
      .expect(401)
      .end(done);
  });
});

// Logout
describe('Destroy all user\'s token', function() {
  it('should return a success message', function(done) {
    api.post(logoutEndpoint)
      .set('Authorization', 'bearer ' + accessToken)
      .expect(200)
      .end(done);
  });
  it('should return an invalid access token error', function(done) {
    api.post(logoutEndpoint)
      .set('Authorization', 'bearer fake')
      .expect(401)
      .end(done);
  });
});
