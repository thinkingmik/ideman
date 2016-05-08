NodeJS OAuth2 API Server
================
Implement OAuth2.0 and basic authentication cleanly into your NodeJS server application.

# Overview
**WARNING**: 
In this demo application we will work on our local machine and will not using `HTTPS` – but you MUST use `HTTPS` in production. Without it, all API authentication mechanisms are compromised.

# Summary
* [Installation](#installation)
* [Basic authentication](#basic_authentication)
* [OAuth2 authorization flows](#authorization_grants)
  * [Authorization code](#authorization_code)
  * [User credentials](#user_credentials)
  * [Client credentials](#client_credentials)
  * [Refresh token](#refresh_token)

# <a name="installation"></a>Installation
In the project's directory, run the following commands:
```
$ npm install
$ npm start
```
Application starts at `http://localhost:3000`

# <a name="basic_authentication"></a>Basic authentication
`HTTP Basic authentication` implementation is the simplest technique for enforcing access controls to web resources because it doesn't require cookies, session identifier and login pages. This authentication method uses static, standard fields in the HTTP header.
## Use cases
* service calls

## Example request
Send in the user credentials directly in the header to call a protected resource:
```
$ curl -u userId:userPwd -X GET http://localhost:3000/users
```

# <a name="authorization_grants"></a>OAuth2 authorization flows
OAuth 2.0 is the next evolution of the OAuth protocol which was originally created in late 2006. OAuth 2.0 focuses on client developer simplicity while providing specific authorization flows for web applications, desktop applications, mobile phones, and living room devices.

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
