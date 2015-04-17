'use strict';

carcloudApp.factory('Account', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl + 'app/rest/account', {}, {
        'update': {method: 'PUT'}
    });
});

carcloudApp.factory('User', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl + 'app/rest/users', {}, {
        'get': {method: 'GET', isArray: true}
    });
});

carcloudApp.factory('Device', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl + 'app/rest/devices/:id', {}, {
        'query': {method: 'GET', isArray: true},
        'get': {method: 'GET'},
        'update': {method: 'PUT'}
    });
});

carcloudApp.factory('Session', function (localStorageService, $rootScope) {

    var session = {};

    session.set = function (username, firstName, lastName, email, phone, authorities) {
        var data = localStorageService.get('session') || {};
        if (username) {
            data.username = username;
        }
        if (firstName) {
            data.firstName = firstName;
        }
        if (lastName) {
            data.lastName = lastName;
        }
        if (email) {
            data.email = email;
        }
        if (authorities) {
            data.authorities = authorities;
        }
        if (phone) {
            data.phone = phone;
        }
        $rootScope.account = data;
        localStorageService.set('session', data);
    };

    session.invalidate = function () {
        $rootScope.account = {};
        localStorageService.remove('session');
    };

    session.get = function () {
        return localStorageService.get('session');
    };

    return session;
});

carcloudApp.factory('Token', function (localStorageService) {
    var token = {};

    token.get = function () {
        return localStorageService.get('token');
    };

    token.set = function (oauthResponse) {
        var data = localStorageService.get('token') || {};
        if (oauthResponse.access_token) {
            httpHeaders.common['Authorization'] = 'Bearer ' + oauthResponse.access_token;
            data.accessToken = oauthResponse.access_token
        }
        if (oauthResponse.refresh_token) {
            data.refreshToken = oauthResponse.refresh_token;
        }
        if (oauthResponse.expires_in) {
            data.expiresAt = setExpiresAt(oauthResponse, data);
        }
        localStorageService.set('token', data);
    };

    token.invalidate = function () {
        localStorageService.remove('token');
    };

    var setExpiresAt = function (oauthResponse) {
        var now = new Date();
        var minutes = parseInt(oauthResponse.expires_in) / 60;
        return new Date(now.getTime() + minutes * 60000).getTime()
    };

    return token;
});

carcloudApp.factory('AuthenticationService',
    function ($base64, $http, $rootScope, Account, authService, API_DETAILS,
              Session, Token) {
        var authenticationService = {};

        var request = {
            'grant_type': API_DETAILS.grantType,
            'scope': API_DETAILS.scope,
            'client_secret': API_DETAILS.clientSecret,
            'client_id': API_DETAILS.clientId
        };

        var authenticationSuccess = function (data, status, headers, configata) {
            Token.set(data);

            Account.get().$promise.then(
                function (account) {
                    account.resource("authorities").query().$promise.then(
                        function (authorities) {
                            Session.set(
                                account.username,
                                account.firstName,
                                account.lastName,
                                account.email,
                                account.phone,
                                authorities
                            );
                            authService.loginConfirmed(null, function (config) {
                                config.headers.Authorization =
                                    "Bearer " + Token.get().accessToken;
                                return config;
                            });
                        },
                        function (data, status, headers, config) {
                            authenticationError(data, status, headers, config)
                        }
                    );
                },
                function (data, status, headers, config) {
                    authenticationError(data, status, headers, config)
                }
            )
        };

        var authenticationError = function (data, status, headers, config) {
            Token.invalidate();
            Session.invalidate();
        };

        authenticationService.login = function (credentials) {
            var loginRequest = {};
            angular.extend(loginRequest, credentials);
            angular.extend(loginRequest, request);

            loginRequest = jQuery.param(loginRequest);
            loginRequest = loginRequest.replace('+', '%20');

            $http.post(API_DETAILS.baseUrl + 'oauth/token', loginRequest, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    "Authorization": "Basic " + $base64.encode(API_DETAILS.clientId
                    + ':'
                    + API_DETAILS.clientSecret)
                }
            })
                .success(function (data, status, headers, config) {
                    authenticationSuccess(data, status, headers, config)
                })
                .error(function (data, status, headers, config) {
                    authenticationError(data, status, headers, config)
                });
        };

        authenticationService.valid = function (authorities) {
            if (!$rootScope.isAuthorized(authorities)) {
                if ($rootScope.authenticated) {
                    $rootScope.$broadcast("event:auth-notAuthorized");
                } else {
                    $rootScope.$broadcast("event:auth-loginRequired");
                }
            }
        };

        authenticationService.isAuthorized = function (authorities) {

            if (!angular.isArray(authorities)) {
                if (authorities === '*') {
                    return true;
                }
                authorities = [authorities];
            }

            var isAuthorized = false;

            angular.forEach(authorities, function (authority) {

                var authorized = ($rootScope.authenticated && $rootScope.account.authorities.indexOf(authority) !== -1);

                if (authorized || authority === '*') {
                    isAuthorized = true;
                }
            });

            return isAuthorized;

        };

        authenticationService.logout = function () {
            $rootScope.authenticated = false;
            $rootScope.authenticationError = false;

            Token.invalidate();
            $http.get(API_DETAILS.baseUrl + 'app/logout');
            Session.invalidate();
            delete httpHeaders.common['Authorization'];
            authService.loginCancelled();
        };

        return authenticationService;
    });