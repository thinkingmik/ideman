Identity Manager 3
================
Implement OAuth2.0 and basic authentication cleanly into your NodeJS server application using [`Bookshelf`](http://bookshelfjs.org/) and [`knex`](http://knexjs.org/) as ORM and queries builder.

# Summary
* [Database](#database)
  * [Tables](#tables)
  * [Diagram](#diagram)
* [Installation](#install)
* [Example](#usage)
* [Documentation](#documentation)
  * [Construction](#construction)
  * [Methods](#methods)
    * [Core](#initialize)
    * [Authorization](#validateusercredentials)
    * [Cryptography](#cipher)
  * [Express middlewares](#middlewares)
  * [Express endpoints](#endpoints)
* [About authorizations](#authorization_grants)
  * [Basic authentication](#basic_authentication)
  * [Authorization code](#authorization_code)
  * [User credentials](#user_credentials)
  * [Client credentials](#client_credentials)
  * [Refresh token](#refresh_token)
* [Credits](#credits)
* [License](#license)

# <a name="database"></a>Database
This module requires a database infrastructure. To automate the creation of schemas and others boring jobs, `ideman` provides a node command line interface tool called [`ideman-cli`](https://github.com/thinkingmik/ideman-cli).
So, before continue with the installation of this module, go to [`ideman-cli`](https://github.com/thinkingmik/ideman-cli) project and then install `ideman`. Otherwise you can create manually the database schema following the documentation below.

## <a name="tables"></a>Tables
## <a name="diagram"></a>Diagram
![alt text](https://github.com/thinkingmik/raw/master/ideman_db_diagram.png "ER Diagram")

# <a name="install"></a>Installation
**WARNING**:
Remember that before installing `ideman` you MUST create the database schemas, otherwise this module will not work ([`ideman-cli`](https://github.com/thinkingmik/ideman-cli)).

In your project root run from command line:
```
$ npm install -save ideman
```

# <a name="usage"></a>Example
Let's start! Install in your application [`Bookshelf`](http://bookshelfjs.org/) and its dependency [`knex`](http://knexjs.org/).  
Create a new file in your project root like:
```javascript
//file: ./ideman.js
var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://postgres:postgres@localhost:5432/ideman?charset=utf-8&ssl=true',
});
var Bookshelf = require('bookshelf')(knex);
var ideman = require('ideman')(Bookshelf);

ideman.init({
  token: {
    life: 3600 //token expiration in seconds
  },
  oauth: {
    authentications: ['bearer' /*, 'basic'*/], //enable bearer token
    grants: ['password', 'refresh_token' /*, 'client_credentials' */] //enable user credentials and refresh token grants
  }
});

module.exports = ideman;
```
Then include this file everywhere you need `ideman` methods, for example in your `Express` application you could have:
```javascript
//file: ./routes/index.js
var express = require('express');
var router = express.Router();
var ideman = require('../ideman');

router.route('/oauth2/token').post(ideman.isClientAuthenticated, ideman.token);
router.route('/protected/resource').post(ideman.isAuthenticated, function() {
  res.json({
    data: 'The protected resource'
  });
});
```

Call the endpoint `/oauth2/token` to retrieve an access token:
```
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&client_id=clientId&client_secret=clientSecret&username=userId&password=userPassword' http://localhost:3000/oauth2/token
```

It will return a JSON response:
```javascript
{
  "access_token":"NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19Xg"
  /* ... */
}
```

With the new `access_token` you can call the protected resource `/protected/resource`
```
$ curl -H 'Authorization: Bearer NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19Xg' -X POST http://localhost:3000/protected/resource
```

# <a name="documentation"></a>Documentation
* [Construction](#construction)
* [Methods](#methods)
* [Middlewares](#middlewares)
* [Endpoints](#endpoints)

## <a name="construction"></a>Construction
### <a name="require"/>require('ideman')( bookshelf [, config]) : Object
The `ideman` module is initialized by injecting an initialized `Bookshelf` instance. It can also accepts a configuration object for database customizations.

__Arguments__

```javascript
bookshelf   {Object} Bookshelf instance
[config]    {Object} Optional models and tables configuration
```

__Returns__

```javascript
{Object} Singleton instance
```

The configuration object allows you to redefine tables and models names. If you don't specify any configuration, it uses a default object:
```javascript
{
  prefix: '',
  entities: {
    user: {
      table: 'users',
      model: 'User'
    },
    client: {
      table: 'clients',
      model: 'Client'
    },
    token: {
      table: 'tokens',
      model: 'Token'
    },
    code: {
      table: 'codes',
      model: 'Code'
    }
  }
}
```

## <a name="methods"></a>Methods
* Core
  * [init](#initialize)
  * [getConfig](#getconfig)
  * [getDbConfig](#getdbconfig)
  * [getBookshelf](#getbookshelf)
  * [getPassport](#getpassport)
  * [getModel](#getmodel)
  * [getModels](#getmodels)
* Authorization
  * [validateUserCredentials](#validateusercredentials)
  * [validateClientCredentials](#validateclientcredentials)
  * [validateBearerToken](#validatebearertoken)
  * [exchangePassword](#exchangepassword)
  * [exchangeClientCredentials](#exchangeclientcredentials)
  * [exchangeRefreshToken](#exchangerefreshtoken)
  * [revokeToken](#revoketoken)
  * [ldapAuthentication](#ldapAuthentication)
* Cryptography
  * [cipher](#cipher)
  * [decipher](#decipher)
  * [crypt](#crypt)
  * [compare](#compare)
  * [verify](#verify)

### <a name="initialize"/>init( options ) : void
Initialization of singleton instance.

__Arguments__

```code
options  {Object} Ideman parameters
```

If you don't specify any paramaters, it uses a default object:
```javascript
{
  oauth2: {
    //Use mandatory client secret in the auth request
    useClientSecret: false,
    //Enables authentications strategies
    authentications: ['basic', 'bearer'],
    //Enables authorizations grants
    grants: ['client_credentials', 'password', 'refresh_token', 'authorization_code']
  },
  validation: {
    //Enables input validation
    enabled: false,
    //Regexp for username
    username: /^[\w\.]{2,100}$/g,
    //Regexp for password
    password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[.)(=,|$@$!%*#?&])[A-Za-z\d.)(=, | $@ $!%*#?&]{8,255}$/g,
    //Regexp for client name
    clientId: /^[\w\.]{2,100}$/g,
    //Regexp for client secret
    clientSecret: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[.)(=,|$@$!%*#?&])[A-Za-z\d.)(=, | $@ $!%*#?&]{8,255}$/g,
  },
  user: {
    //Users' password are crypted and compared by the specified mode below
    passwordEnc: 'bcrypt' //bcrypt|crypto|none
  },
  ldap: {
    //Enable LDAP user binding
    enabled: true,
    //LDAP client options
    options: {
      ssl: false,
      timeout: null,
      connectTimeout: null,
      strictdn: false
    },
    //List of dc controllers
    domainControllers: [],
    //LDAP search path, ex. ou=users,dc=acme,dc=com
    searchScope: null,
    //Search filters, ex. (|(cn=<username>)(mail=<username>))
    authAttributes: ['cn', 'mail'],
    //Returned attribute after search (returned value must match with username column for a successful login)
    returnAttribute: 'dn',
    //LDAP root credentials
    root: {
      dn: null, //cn=admin,dc=acme,dc=com
      password: {
        crypto: false,
        value: null
      }
    }
  },
  crypto: {
    //Secret key to cipher/decipher client/user secret
    secretKey: 'o!rDE(Qbrq7u4OV',
    //Cipher algorithm
    algorithm: 'AES-256-CBC',
    //Input encoding for client/user secret before cipher
    inputEncoding: 'utf8', //utf8|base64|hex
    //Output encoding for client/user secret after cipher
    outputEncoding: 'base64' //utf8|base64|hex
  },
  token: {
    //Token life in seconds
    life: 3600,
    //Token length in bytes
    length: 32, //bytes
    //Delete active tokens on login
    autoRemove: true,
    jwt: {
      //Enables jwt token instead the standard token
      enabled: false,
      //Check if IP caller are the same of jwt IP when it was created
      ipcheck: false,
      //Check if user-agent caller are the same of jwt user-agent when it was created
      uacheck: false,
      //Secret key for signing jwt token
      secretKey: 'K7pHX4OASe?c&lm'
    }
  }
}
```
---------------------------------------

### <a name="getconfig"/>getConfig() : Object
Gets the `ideman` initialization object.

__Returns__

```code
{Object} Ideman parameters
```
---------------------------------------

### <a name="getdbconfig"/>getDbConfig() : Object
Gets the `ideman` database configuration object.

__Returns__

```code
{Object} Ideman db config
```
---------------------------------------

### <a name="getbookshelf"/>getBookshelf() : Object
Gets the `Bookshelf` instance.

__Returns__

```code
{Object} Bookshelf instance
```
---------------------------------------

### <a name="getpassport"/>getPassport() : Object
Gets the `passport` instance.

__Returns__

```code
{Object} Passport instance
```

It is useful when you need to initialize `passport` for `Express` without installing it in your application.
For example when you use the middlewares methods of `ideman` module, your `Express` application needs to be configured with:

```javascript
var app = express();
app.use(passport.initialize());
```
---------------------------------------

### <a name="getmodel"/>getModel( name ) : Object
Gets a `Bookshelf` model. Available default models are: `User`, `Client`, `Token`, `Code`.

__Arguments__

```code
name  {string} Model name
```

__Returns__

```code
{Object} Bookshelf model
```

Now you can extend a `Bookshelf` model in your application:

```javascript
var bookshelf = ideman.getBookshelf();
var User = ideman.getModel('User');
var UserExt = bookshelf.model('UserExt', User.extend({
  test: function() {
    console.log('hello world');
    return;
  }
}));
console.log(UserExt.forge().tableName);
```
---------------------------------------

### <a name="getmodels"/>getModels() : Array
Gets all `Bookshelf` models.

__Returns__

```code
{Array} All bookshelf models
```
---------------------------------------

### <a name="validateusercredentials"/>validateUserCredentials( username, password ) : Promise( Object )
Checks if user credentials are valid.

__Arguments__

```code
username  {string} Username
password  {string} Clear password
```

__Returns__

```code
{Object} Returns a promise with bookshelf `User` model
```
---------------------------------------

### <a name="validateclientcredentials"/>validateClientCredentials( name, secret ) : Promise( Object )
Checks if client credentials are valid.

__Arguments__

```code
name    {string} Client name
secret  {string} Clear client secret
```

__Returns__

```code
{Object} Returns a promise with bookshelf `Client` model
```
---------------------------------------

### <a name="validatebearertoken"/>validateBearerToken( token [, ip, userAgent] ) : Promise( Object )
Checks if token is valid.

__Arguments__

```code
token        {string} Bearer token
[ip]         {string} Optional IP address to check
[userAgent]  {string} Optional user agent to check
```

__Returns__

```code
{Object} Returns a promise with referred bookshelf `User` or `Client` model
```
---------------------------------------

### <a name="exchangepassword"/>exchangePassword( client, username, password [, ip, userAgent] ) : Promise( Object )
Exchanges user's credentials for an access token. The client input object must be an existing entity into database.  

__Arguments__

```code
client       {Object} Bookshelf `Client` model
username     {string} Username
password     {string} Clear password
[ip]         {string} Optional IP address to save with token
[userAgent]  {string} Optional user agent to save with token
```

__Returns__

```code
{Object} Returns a promise with tokens
```

Example of a common scenario:
```javascript
var promise = ideman.validateClientCredentials('name', 'secret')
.then(function(client) {
  return ideman.exchangePassword(client, 'username', 'password');
});
```

The returned JSON object is like:
```json
{
  "access_token":"<token>",
  "refresh_token":"<refreshtoken>",
  "expires_in":3600,
  "token_type":"Bearer"
}
```
---------------------------------------

### <a name="exchangeclientcredentials"/>exchangeClientCredentials( client [, ip, userAgent] ) : Promise( Object )
Exchanges client's credentials for an access token. The client input object must be an existing entity into database.

__Arguments__

```code
client       {Object} Bookshelf `Client` model
[ip]         {string} Optional IP address to save with token
[userAgent]  {string} Optional user agent to save with token
```

__Returns__

```code
{Object} Returns a promise with tokens
```

The returned JSON object is like:
```json
{
  "access_token":"<token>",
  "refresh_token":"<refreshtoken>",
  "expires_in":3600,
  "token_type":"Bearer"
}
```
---------------------------------------

### <a name="exchangerefreshtoken"/>exchangeRefreshToken( client, refreshToken ) : Promise( Object )
Exchanges a refesh token for a new access token. The client input object must be an existing entity into database.

__Arguments__

```code
client        {Object} Bookshelf `Client` model
refreshToken  {string} Refresh token
```

__Returns__

```code
{Object} Returns a promise with tokens
```

The returned JSON object is like:
```json
{
  "access_token":"<token>",
  "refresh_token":"<refreshtoken>",
  "expires_in":3600,
  "token_type":"Bearer"
}
```
---------------------------------------

### <a name="revoketoken"/>revokeToken( token, force ) : Promise( bool )
Revokes a token. If `force` is specified it removes all active tokens associated to user or client.

__Arguments__

```code
token  {string} Access token
force  {bool}   Removes all tokens
```

__Returns__

```code
{bool} Returns true
```
---------------------------------------

### <a name="ldapAuthentication"/>ldapAuthentication( username, password ) : Promise( string )
Checks credentials for the given user on LDAP.

__Arguments__

```code
username  {string}  Username
password  {string}  Password
```

__Returns__

```code
{string} Returns null if user was not found, otherwise the attribute value specified in configuration
```

__Throws__

```code
{LDAPConnectionError|LDAPBindError|LDAPUnbindError|LDAPSearchError}
```
---------------------------------------

### <a name="cipher"/>cipher( text ) : Promise( string )
Cipher a text with crypto. The operation is reversible.

__Arguments__

```code
text  {string} Text to cipher
```

__Returns__

```code
{string} Returns the ciphered text
```

__Throws__

```code
{CipherHashError}
```
---------------------------------------

### <a name="cipher"/>decipher( text ) : Promise( string )
Decipher a ciphered text with crypto.

__Arguments__

```code
text  {string} Text to decipher
```

__Returns__

```code
{string} Returns the deciphered text
```

__Throws__

```code
{CipherHashError}
```
---------------------------------------

### <a name="cipher"/>crypt( text ) : Promise( string )
Crypt a text with bcrypt. The operation is not reversible.

__Arguments__

```code
text  {string} Text to crypt
```

__Returns__

```code
{string} Returns the crypted text
```

__Throws__
```code
{CryptHashError}
```
---------------------------------------

### <a name="compare"/>compare( text, ciphered, force ) : Promise( bool )
Check if the clear text matches with the ciphered text. If force is specified it accepts two ciphered strings to compare. Use this method only with ciphered text.

__Arguments__

```code
text      {string}  Text to compare with ciphered
ciphered  {string}  Ciphered text
force     {bool}    Force the compare
```

__Returns__

```code
{bool} Returns the result of the match
```

__Throws__
```code
{CipherHashError}
```
---------------------------------------

### <a name="verify"/>verify( text, crypted ) : Promise( bool )
Check if the clear text matches with the crypted text. Use this method only with crypted text.

__Arguments__

```code
text     {string}  Text to compare with ciphered
crypted  {string}  Crypted text
```

__Returns__

```code
{bool} Returns the result of the match
```

__Throws__
```code
{CryptHashError}
```

## <a name="middlewares"></a>`Express` middlewares
* [isAuthenticated](#isauthenticated)
* [isClientAuthenticated](#isclientauthenticated)

### <a name="isauthenticated"/>isAuthenticated
This middleware protects your endpoint and checks if request contains basic credentials or a valid bearer token.
See [`about authorizations`](https://github.com/thinkingmik/ideman#authorization_grants) for request's details.

__Example__

```javascript
router.route('/protected/resource').post(ideman.isAuthenticated, function() {
  res.json({
    data: 'The protected resource'
  });
});
```

__Request__

```
# using HTTP Basic Authentication
$ curl -u userId:userPwd -X GET http://localhost:3000/protected/resource

# using Bearer token
$ curl -H 'Authorization: Bearer NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19Xg' -X POST http://localhost:3000/protected/resource
```
---------------------------------------

### <a name="isclientauthenticated"/>isClientAuthenticated
This middleware has been used with [`token`](https://github.com/thinkingmik/ideman#token) endpoint and checks for valid client credentials before getting an access token.
See [`about authorizations`](https://github.com/thinkingmik/ideman#authorization_grants) for request's details.

__Example__

```javascript
router.route('/oauth2/token').post(ideman.isClientAuthenticated, ideman.token);
```

__Request__

```
# user credentials grant
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&client_id=clientId&username=userId&password=userPassword' http://localhost:3000/oauth2/token

# user credentials grant with basic auth
$ curl -u clientId:clientSecret -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&username=userId&password=userPassword' http://localhost:3000/oauth2/token

# client credentials grant
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=client_credentials&client_id=clientId&client_secret=clientSecret' http://localhost:3000/oauth2/token

# client credentials grant with basic auth
$ curl -u clientId:clientSecret -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=client_credentials' http://localhost:3000/oauth2/token

# refresh token grant
$ curl -H 'Accept: application/x-www-form-urlencoded' -u clientId:clientSecret -X POST -d 'grant_type=refresh_token&refresh_token=wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTv3ZeN' http://localhost:3000/oauth2/token
```
---------------------------------------

## <a name="endpoints"></a>`Express` endpoints
* [token](#token)
* [logout](#logout)

### <a name="token"/>token
This endpoint has been used with [`isClientAuthenticated`](https://github.com/thinkingmik/ideman#isclientauthenticated) middleware and returns an access token.

__Example__

```javascript
router.route('/oauth2/token').post(ideman.isClientAuthenticated, ideman.token);
```
---------------------------------------

### <a name="logout"/>logout
This endpoint has been used with [`isAuthenticated`](https://github.com/thinkingmik/ideman#isauthenticated) middleware and revokes the current token.

__Example__

```javascript
router.route('/oauth2/logout').post(ideman.isAuthenticated, ideman.logout);
```

# <a name="authorization_grants"></a>About authorizations
OAuth 2.0 is the next evolution of the OAuth protocol which was originally created in late 2006. OAuth 2.0 focuses on client developer simplicity while providing specific authorization flows for web applications, desktop applications, mobile phones, and living room devices.

## <a name="basic_authentication"></a>Basic authentication
`HTTP Basic authentication` implementation is the simplest technique for enforcing access controls to web resources because it doesn't require cookies, session identifier and login pages. This authentication method uses static, standard fields in the HTTP header.
## Use cases
* service calls

## Example request
Send in the user credentials directly in the header to call a protected resource:
```
$ curl -u userId:userPwd -X GET http://localhost:3000/users
```

## <a name="authorization_code"></a>Authorization Code
The `Authorization Code` grant type is used when the client wants to request access to protected resources on behalf of another user (i.e. a 3rd party). This is the grant type most often associated with OAuth.

### Use cases
* calls on behalf of a third party

### Example request
First, redirect the user to the following URL:
```
http://localhost:3000/oauth2/authorize?client_id=client&response_type=code&redirect_uri=http://localhost:3000
```

A successful authorization will pass the client the authorization code in the URL via the supplied redirect_uri:
```
http://localhost:3000/?code=0tlpnc37ElYTa7Sh
```

Once this is done, a token can be requested using the authorization code.
```
$ curl -u clientId:clientSecret -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=authorization_code&code=0tlpnc37ElYTa7Sh&redirect_uti=http://localhost:3000' http://localhost:3000/oauth2/token
```

A successful token request will return a standard access token in JSON format:
```json
{
  "access_token":"NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19XgEOprNnKuxi8DGcK59aAdUCBhqosKV8GDw4pwxdzoryjaViv0GQi04d0cWFZRxxqheF552h7Ok7SOCL8ndxPgLqf5WzSy22zHF5Hhg8SZPRCAPOos6QgDi4oZnR0EGkyhEgHCchKUDmfmHWxlqCuZDau2gswwx41h9ZhozvLVJJIB0rB4huVGg7sCyqtbo5Lg1M61BwjahWd",
  "refresh_token":"wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTHLgxg0CIBY13G2O46PAWNUtaoDgWRYONYR7u9npnkQeCAXqi2MFuXfJnrWOCFf3nJiWU76cZUV1jgQzR1I2YQngfTvvT96gO8qCrhLjikWDzMnv9yexwubEfX7LcG5eekzKQrW9UwZgP3kaas46nEUXs5G5VY8Fl79JnHk0uDvKZR1ERsdbtHwVWkZSmGC5TEiRfPVv3ZeN",
  "expires_in":3600,
  "token_type":"Bearer"
}
```

## <a name="user_credentials"></a>User Credentials
The `User Credentials` grant type (a.k.a. `Resource Owner Password Credentials`) is used when the user has a trusted relationship with the client, and so can supply credentials directly.

### Use cases
* when the client wishes to display a login form
* for applications owned and operated by the resource server (such as a mobile or desktop application)
* for applications migrating away from using direct authentication and stored credentials

### Example request
Send in the user credentials directly to receive an access token:
```
# using POST Body
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&client_id=clientId&client_secret=clientSecret&username=userId&password=userPassword' http://localhost:3000/oauth2/token

# using HTTP Basic Authentication
$ curl -u clientId:clientSecret -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&username=userId&password=userPassword' http://localhost:3000/oauth2/token
```

A successful token request will return a standard access token in JSON format:
```json
{
  "access_token":"NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19XgEOprNnKuxi8DGcK59aAdUCBhqosKV8GDw4pwxdzoryjaViv0GQi04d0cWFZRxxqheF552h7Ok7SOCL8ndxPgLqf5WzSy22zHF5Hhg8SZPRCAPOos6QgDi4oZnR0EGkyhEgHCchKUDmfmHWxlqCuZDau2gswwx41h9ZhozvLVJJIB0rB4huVGg7sCyqtbo5Lg1M61BwjahWd",
  "refresh_token":"wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTHLgxg0CIBY13G2O46PAWNUtaoDgWRYONYR7u9npnkQeCAXqi2MFuXfJnrWOCFf3nJiWU76cZUV1jgQzR1I2YQngfTvvT96gO8qCrhLjikWDzMnv9yexwubEfX7LcG5eekzKQrW9UwZgP3kaas46nEUXs5G5VY8Fl79JnHk0uDvKZR1ERsdbtHwVWkZSmGC5TEiRfPVv3ZeN",
  "expires_in":3600,
  "token_type":"Bearer"
}
```

## <a name="client_credentials"></a>Client Credentials
The `Client Credentials` grant type is used when the client is requesting access to protected resources under its control (i.e. there is no third party).

### Use cases
* service calls (machine-to-machine authentication).
* calls on behalf of the user who created the client.

### Example request
Send in the client credentials directly to receive an access token:
```
# using POST Body
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=client_credentials&client_id=clientId&client_secret=clientSecret' http://localhost:3000/oauth2/token

# using HTTP Basic Authentication
$ curl -u clientId:clientSecret -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=client_credentials' http://localhost:3000/oauth2/token
```

A successful token request will return a standard access token in JSON format:
```json
{
  "access_token":"NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19XgEOprNnKuxi8DGcK59aAdUCBhqosKV8GDw4pwxdzoryjaViv0GQi04d0cWFZRxxqheF552h7Ok7SOCL8ndxPgLqf5WzSy22zHF5Hhg8SZPRCAPOos6QgDi4oZnR0EGkyhEgHCchKUDmfmHWxlqCuZDau2gswwx41h9ZhozvLVJJIB0rB4huVGg7sCyqtbo5Lg1M61BwjahWd",
  "refresh_token":"wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTHLgxg0CIBY13G2O46PAWNUtaoDgWRYONYR7u9npnkQeCAXqi2MFuXfJnrWOCFf3nJiWU76cZUV1jgQzR1I2YQngfTvvT96gO8qCrhLjikWDzMnv9yexwubEfX7LcG5eekzKQrW9UwZgP3kaas46nEUXs5G5VY8Fl79JnHk0uDvKZR1ERsdbtHwVWkZSmGC5TEiRfPVv3ZeN",
  "expires_in":3600,
  "token_type":"Bearer"
}
```

## <a name="refresh_token"></a>Refresh Token
The `Refresh Token` grant type is used to obtain additional access tokens in order to prolong the client’s authorization of a user’s resources.

### Use cases
* to allow clients prolonged access of a user’s resources
* to retrieve additional tokens of equal or lesser scope for separate resource calls

### Example request
First, a refresh token must be retrieved using the Authorizaton Code or User Credentials grant types:
```
$ curl -H 'Accept: application/x-www-form-urlencoded' -X POST -d 'grant_type=password&client_id=clientId&client_secret=clientSecret&username=userId&password=userPassword' http://localhost:3000/oauth2/token
```

The access token will then contain a refresh token:
```json
{
  "access_token":"NgvhmoKm9ASMCa3KGLh2yjNPqhIhFLEgPacesMFiIOQPuZ1Mq19XgEOprNnKuxi8DGcK59aAdUCBhqosKV8GDw4pwxdzoryjaViv0GQi04d0cWFZRxxqheF552h7Ok7SOCL8ndxPgLqf5WzSy22zHF5Hhg8SZPRCAPOos6QgDi4oZnR0EGkyhEgHCchKUDmfmHWxlqCuZDau2gswwx41h9ZhozvLVJJIB0rB4huVGg7sCyqtbo5Lg1M61BwjahWd",
  "refresh_token":"wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTHLgxg0CIBY13G2O46PAWNUtaoDgWRYONYR7u9npnkQeCAXqi2MFuXfJnrWOCFf3nJiWU76cZUV1jgQzR1I2YQngfTvvT96gO8qCrhLjikWDzMnv9yexwubEfX7LcG5eekzKQrW9UwZgP3kaas46nEUXs5G5VY8Fl79JnHk0uDvKZR1ERsdbtHwVWkZSmGC5TEiRfPVv3ZeN",
  "expires_in":3600,
  "token_type":"Bearer"
}
```

This refresh token can then be used to generate a new access token of equal or lesser scope:
```
$ curl -H 'Accept: application/x-www-form-urlencoded' -u clientId:clientSecret -X POST -d 'grant_type=refresh_token&refresh_token=wRv7bQiR8W7mEYTTlHsSXw4HL0DqP2qM12gQTN7XbSq74Z7JkNyUTHLgxg0CIBY13G2O46PAWNUtaoDgWRYONYR7u9npnkQeCAXqi2MFuXfJnrWOCFf3nJiWU76cZUV1jgQzR1I2YQngfTvvT96gO8qCrhLjikWDzMnv9yexwubEfX7LcG5eekzKQrW9UwZgP3kaas46nEUXs5G5VY8Fl79JnHk0uDvKZR1ERsdbtHwVWkZSmGC5TEiRfPVv3ZeN' http://localhost:3000/oauth2/token
```

A successful token request will return a standard access token in JSON format:
```json
{
  "access_token":"vLBojG5gsVvP7EwIfu9OEAE1daWsicRLN4KmS4goRUdoJPagEx1rvOce1UVbQc2S8EVEP47A9KmWGqofyT94AE7zVowigyE4eobqVmNvb6z6yRHZNT2oaTZ486yThtrJ078SuqRhPRM67KG37c6KJTLDZPECYYZN3fefBFlFG9EbOFeAChszT6kXI96Q9uunZKRuadMEcl8PqueqDfJh203DPzDwwX33lufJYPgZGnZdaVeY11c26NwOkk68g6wx",
  "refresh_token":"h5odKWZh9p3ueYDK10RljCblXbsPOKNjX0HhaV0EcCOn4DNm5PX8NtpEoWo2LTL717rNcHXF8LoosrDtrNn9BOLZHJVpuItfzM8pHJFB8gMBBE8NVkDSin1qvaRs8ubWxxLN8PE9qbZSvo4NBzsbhwLS49HMmL4z963S4YXWQrtu5t829NuWGvYU2UBlSNYIUsrBOZe9bW0XZJ5xEBdHZ4tBg06tSDE4VZTyGwtjk8HTkMAqybGwA8FB6UggRNr7",
  "expires_in":3600,
  "token_type":"Bearer"
}
```

# <a name="credits"></a>Credits
- [oauth2orize](https://github.com/jaredhanson/oauth2orize) by Jared Hanson
- [knex](https://github.com/tgriesser/knex) by Tim Griesser
- [bookshelf](https://github.com/tgriesser/bookshelf) by Tim Griesser
- [ldapjs](https://github.com/mcavage/node-ldapjs) by Mark Cavage

# <a name="license"></a>License
The [MIT License](https://github.com/thinkingmik/ideman/blob/master/LICENSE)

Copyright (c) 2017 Michele Andreoli <http://thinkingmik.com>
