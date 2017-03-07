var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var ideman = require('./server/ideman');
var Promise = require('bluebird');

var username = '';
var password = '';
var fakePassword = 'asd';
var ldapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ['127.0.0.1'],
    searchScope: '',
    authAttributes: ['sAMAccountName'],
    returnAttribute: 'sAMAccountName',
    root: {
      dn: '',
      password: {
        crypto: true,
        value: ''
      }
    }
  }
};
var wrongConnectionLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ['127.0.0.1'],
    searchScope: '',
    authAttributes: ['sAMAccountName'],
    returnAttribute: 'sAMAccountName',
    root: {
      dn: '',
      password: {
        crypto: true,
        value: ''
      }
    }
  }
};
var wrongBindLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ['127.0.0.1'],
    searchScope: '',
    authAttributes: ['sAMAccountName'],
    returnAttribute: 'sAMAccountName',
    root: {
      dn: '',
      password: {
        crypto: true,
        value: ''
      }
    }
  }
};
var wrongSearchLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ['127.0.0.1'],
    searchScope: '',
    authAttributes: ['sAMAccountName'],
    returnAttribute: 'sAMAccountName',
    root: {
      dn: '',
      password: {
        crypto: true,
        value: ''
      }
    }
  }
};
var wrongSearchFilterLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ['127.0.0.1'],
    searchScope: '',
    authAttributes: ['cn'],
    returnAttribute: 'sAMAccountName',
    root: {
      dn: '',
      password: {
        crypto: true,
        value: ''
      }
    }
  }
};

// Cipher method
describe('Authenticate through LDAP', function() {
  this.timeout(5000);
  it('should return a connection error', function() {
    ideman.init(wrongConnectionLdapOptions);
    return ideman.ldapAuthentication(username, password)
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPConnectionError');
    });
  });
  it('should return a bind error', function() {
    ideman.init(wrongBindLdapOptions);
    return ideman.ldapAuthentication(username, password)
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPBindError');
    });
  });
  it('should return a search error', function() {
    ideman.init(wrongSearchLdapOptions);
    return ideman.ldapAuthentication(username, password)
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPSearchError');
    });
  });
  it('should return false (wrong search filter)', function() {
    ideman.init(wrongSearchFilterLdapOptions);
    return ideman.ldapAuthentication(username, password)
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should return false', function() {
    ideman.init(ldapOptions);
    return ideman.ldapAuthentication(username, fakePassword)
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should return true', function() {
    ideman.init(ldapOptions);
    return ideman.ldapAuthentication(username, password)
    .then(function(res) {
      expect(res).to.not.be.null;
    });
  });
});
