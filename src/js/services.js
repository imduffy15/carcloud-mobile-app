'use strict';

/* Services */

carcloudApp.factory('Register', function ($resource, API_DETAILS) {
	return $resource(API_DETAILS.baseUrl + 'app/rest/register', {}, {});
});

carcloudApp.factory('Activate', function ($resource, API_DETAILS) {
	return $resource(API_DETAILS.baseUrl + 'app/rest/activate', {}, {
		'get': {method: 'GET', params: {}, isArray: false}
	});
});

carcloudApp.factory('Account', function ($resource, API_DETAILS) {
	return $resource(API_DETAILS.baseUrl + 'app/rest/account', {}, {});
});

carcloudApp.factory('Password', function ($resource, API_DETAILS) {
	return $resource(API_DETAILS.baseUrl + 'app/rest/account/change_password', {}, {});
});

carcloudApp.factory('Session', function () {
    this.create = function (email, firstName, lastName, authorities) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.authorities = [];
        angular.forEach(authorities, function(authority) {
            this.authorities.push(authority['name']);
        }, this);
    };
    this.invalidate = function () {
        this.firstName = null;
        this.lastName = null;
        this.email = null;
        this.authorities = null;
    };
    return this;
});

carcloudApp.factory('AuthenticationSharedService', function ($rootScope, $http, $ionicLoading, $ionicViewService, $cordovaDialogs, authService, Session, Account, Base64Service, Token, API_DETAILS) {
	return {
        login: function (param) {
            var data = "username=" + param.username + "&password=" + param.password + "&grant_type=password&scope=read%20write&client_secret=Echoong7zooNga3tvohy6Xaeoon9Aem3ange8Iga5ooDa1ahb8LaS2&client_id=carcloudapp";
            $http.post(API_DETAILS.baseUrl + '/oauth/token', data, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "Authorization": "Basic " + Base64Service.encode("carcloudapp" + ':' + "Echoong7zooNga3tvohy6Xaeoon9Aem3ange8Iga5ooDa1ahb8LaS2")
                },
                ignoreAuthModule: 'ignoreAuthModule'
            }).success(function (data, status, headers, config) {
                httpHeaders.common['Authorization'] = 'Bearer ' + data.access_token;
                Token.set(data);

                Account.get(function (data) {
                    Session.create(data.email, data.firstName, data.lastName, data.authorities);
                    $rootScope.account = Session;
                    authService.loginConfirmed(data);
                });
            }).error(function (data, status, headers, config) {
                $rootScope.authenticationError = true;
                Session.invalidate();
            });
        },
        refresh: function () {
            var data = "refresh_token=" + Token.get('refresh_token') + "&grant_type=refresh_token&client_secret=mySecretOAuthSecret&client_id=carcloudapp";
            $http.post(API_DETAILS.baseUrl + '/oauth/token', data, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "Authorization": "Basic " + Base64Service.encode("carcloudapp" + ':' + "Echoong7zooNga3tvohy6Xaeoon9Aem3ange8Iga5ooDa1ahb8LaS2")
                },
                ignoreAuthModule: 'ignoreAuthModule'
            }).success(function (data, status, headers, config) {
                if (data.access_token) httpHeaders.common['Authorization'] = 'Bearer ' + data.access_token;
                Token.set(data);

                Account.get(function (data) {
                    Session.create(data.email, data.firstName, data.lastName, data.authorities);
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
        valid: function (authorities) {
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
                        Session.create(data.email, data.firstName, data.lastName, data.authorities);
                        $rootScope.account = Session;

                        if (!$rootScope.isAuthorized(authorities)) {
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
        isAuthorized: function (authorities) {
            if (!angular.isArray(authorities)) {
                if (authorities == '*') {
                    return true;
                }

                authorities = [authorities];
            }

            var isAuthorized = false;
            angular.forEach(authorities, function (authority) {
                var authorized = (Session.authorities.indexOf(authority) !== -1);
                if (authorized || authorities == '*') {
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
			$ionicViewService.clearHistory();
			authService.loginCancelled();
		}
	};
});
