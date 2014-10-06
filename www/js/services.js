'use strict';

/* Services */

carcloudApp.factory('Register', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl +  'app/rest/register', {}, {
    });
});

carcloudApp.factory('Activate', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl +  'app/rest/activate', {}, {
        'get': { method: 'GET', params: {}, isArray: false}
    });
});

carcloudApp.factory('Account', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl +  'app/rest/account', {}, {
    });
});

carcloudApp.factory('Password', function ($resource, API_DETAILS) {
    return $resource(API_DETAILS.baseUrl + 'app/rest/account/change_password', {}, {
    });
});

carcloudApp.factory('Session', function () {
    this.create = function (login, firstName, lastName, email, userRoles) {
        this.login = login;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.userRoles = userRoles;
    };
    this.invalidate = function () {
        this.login = null;
        this.firstName = null;
        this.lastName = null;
        this.email = null;
        this.userRoles = null;
    };
    return this;
});

carcloudApp.factory('AuthenticationSharedService', function ($rootScope, $http, $ionicLoading, $cordovaDialogs, authService, Session, Account, Base64Service, Token, API_DETAILS) {
    return {
        login: function (param) {
            var data = "username=" + param.username + "&password=" + param.password + "&grant_type=password&scope=read%20write&client_secret=" + API_DETAILS.clientSecret +"&client_id=" + API_DETAILS.clientId;
            $ionicLoading.show({template: '<i class="icon ion-loading-d"></i> Logging in...', delay: 500});
            $http.post(API_DETAILS.baseUrl + 'oauth/token', data, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "Authorization": "Basic " + Base64Service.encode(API_DETAILS.clientId + ':' + API_DETAILS.clientSecret)
                },
                ignoreAuthModule: 'ignoreAuthModule'
            }).success(function (data, status, headers, config) {
                httpHeaders.common['Authorization'] = 'Bearer ' + data.access_token;
                Token.set(data);

                Account.get(function (data) {
                    Session.create(data.login, data.firstName, data.lastName, data.email, data.roles);
                    $rootScope.account = Session;
                    authService.loginConfirmed(data);
                });
                $ionicLoading.hide();
            }).error(function (data, status, headers, config) {
                $rootScope.authenticationError = true;
                Session.invalidate();
                $ionicLoading.hide();
                if(status == 400) {
                    $cordovaDialogs.alert(data.error_description, 'Failed Login!');
                }
            });
        },
        refresh: function () {
            var data = "refresh_token=" + Token.get('refresh_token') + "&grant_type=refresh_token&client_secret=" + API_DETAILS.clientSecret + "&client_id=" + API_DETAILS.clientId;
            $http.post(API_DETAILS.baseUrl + 'oauth/token', data, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "Authorization": "Basic " + Base64Service.encode(API_DETAILS.clientId + ':' + API_DETAILS.clientSecret)
                },
                ignoreAuthModule: 'ignoreAuthModule'
            }).success(function (data, status, headers, config) {
                if (data.access_token) httpHeaders.common['Authorization'] = 'Bearer ' + data.access_token;
                Token.set(data);

                Account.get(function (data) {
                    Session.create(data.login, data.firstName, data.lastName, data.email, data.roles);
                    $rootScope.account = Session;
                    authService.loginConfirmed(data, function (config) {
                        config.headers['Authorization'] = 'Bearer ' + Token.get('access_token');
                        return config;
                    });
                });
            }).error(function (data, status, headers, config) {
                $rootScope.authenticationError = true;
                Session.invalidate();
            });
        },
        valid: function (authorizedRoles) {
            if (Token.get('access_token')) httpHeaders.common['Authorization'] = 'Bearer ' + Token.get('access_token');

            $http.get(API_DETAILS.baseUrl + 'app/rest/account', {
                ignoreAuthModule: 'ignoreAuthModule'
            }).success(function (data, status, headers, config) {
                if (!Session.login || Token.get('access_token') != undefined) {
                    if (Token.get('access_token') == undefined || Token.expired()) {
                        $rootScope.authenticated = false;
                        return;
                    }
                    Account.get(function (data) {
                        Session.create(data.login, data.firstName, data.lastName, data.email, data.roles);
                        $rootScope.account = Session;

                        if (!$rootScope.isAuthorized(authorizedRoles)) {
                            event.preventDefault();
                            // user is not allowed
                            $rootScope.$broadcast("event:auth-notAuthorized");
                        }

                        $rootScope.authenticated = true;
                    });
                }
                $rootScope.authenticated = !!Session.login;
            }).error(function (data, status, headers, config) {
                $rootScope.authenticated = false;
            });
        },
        isAuthorized: function (authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                if (authorizedRoles == '*') {
                    return true;
                }

                authorizedRoles = [authorizedRoles];
            }

            var isAuthorized = false;
            angular.forEach(authorizedRoles, function (authorizedRole) {
                var authorized = (!!Session.login &&
                    Session.userRoles.indexOf(authorizedRole) !== -1);

                if (authorized || authorizedRole == '*') {
                    isAuthorized = true;
                }
            });

            return isAuthorized;
        },
        logout: function () {
            $rootScope.authenticationError = false;
            $rootScope.authenticated = false;
            $rootScope.account = null;
            Token.remove();

            $http.get('app/logout');
            Session.invalidate();
            delete httpHeaders.common['Authorization'];
            authService.loginCancelled();
        }
    };
});