var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var ideman = require('./server/ideman');
var Promise = require('bluebird');

var username = 'm.andreoli';
var password = 'Password1.';
var fakePassword = 'asd';
var ldapServer = ['192.168.99.100'];
var fakeLdapServer = ['127.0.0.1'];
var scope = 'ou=users,dc=acme,dc=com';
var fakeScope = 'ou=xxx,dc=acme,dc=com';
var rootDn = 'cn=admin,dc=acme,dc=com';
var fakeRootDn = 'cn=xxx,dc=acme,dc=com';
var passwordRoot = 'uV1ju3uY1JerhQ9z/nPr2w==';
var fakePasswordRoot = '1iuktueqUpn3q9GvT2KaLQ==';

var ldapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ldapServer,
    searchScope: scope,
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'mail',
    root: {
      dn: rootDn,
      password: {
        crypto: true,
        value: passwordRoot
      }
    }
  }
};
var wrongConnectionLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: fakeLdapServer,
    searchScope: scope,
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'mail',
    root: {
      dn: rootDn,
      password: {
        crypto: true,
        value: passwordRoot
      }
    }
  }
};
var wrongBindLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ldapServer,
    searchScope: scope,
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'mail',
    root: {
      dn: fakeRootDn,
      password: {
        crypto: true,
        value: passwordRoot
      }
    }
  }
};
var wrongSearchLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ldapServer,
    searchScope: fakeScope,
    authAttributes: ['cn', 'mail'],
    returnAttribute: 'mail',
    root: {
      dn: rootDn,
      password: {
        crypto: true,
        value: passwordRoot
      }
    }
  }
};
var wrongSearchFilterLdapOptions = {
  ldap: {
    enabled: true,
    domainControllers: ldapServer,
    searchScope: scope,
    authAttributes: ['sn'],
    returnAttribute: 'mail',
    root: {
      dn: rootDn,
      password: {
        crypto: true,
        value: passwordRoot
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
  it('should return null (wrong search filter)', function() {
    ideman.init(wrongSearchFilterLdapOptions);
    return ideman.ldapAuthentication(username, password)
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should return null', function() {
    ideman.init(ldapOptions);
    return ideman.ldapAuthentication(username, fakePassword)
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should not return null', function() {
    ideman.init(ldapOptions);
    return ideman.ldapAuthentication(username, password)
    .then(function(res) {
      expect(res).to.not.be.null;
    });
  });
});
