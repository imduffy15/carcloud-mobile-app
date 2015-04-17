'use strict';

var httpHeaders;

var carcloudApp = angular.module('carcloudApp', ['ionic', 'ngAnimate', 'ngCordova', 'http-auth-interceptor', 'ngResource', 'ui.gravatar', 'hateoas', 'LocalStorageModule', 'base64', 'ui.bootstrap']);

carcloudApp
    .config(function ($httpProvider, $stateProvider, $urlRouterProvider, USER_ROLES, gravatarServiceProvider, localStorageServiceProvider, HateoasInterceptorProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl',
                access: {
                    authorities: [USER_ROLES.all]
                }
            })

            .state('logout', {
                url: '/logout',
                controller: 'LogoutController',
                access: {
                    authorities: [USER_ROLES.all]
                }
            })

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl',
                access: {
                    authorities: [USER_ROLES.user]
                }
            })

            .state('app.home', {
                url: "/home",
                views: {
                    'menuContent': {
                        templateUrl: "templates/devices.html",
                        controller: 'DeviceCtrl'
                    }
                },
                resolve: {
                    devices: function ($q, Device) {

                        var deferred = $q.defer();
                        var devices = {};

                        Device.query().$promise.then(function (data) {
                            angular.forEach(data, function (device) {
                                device.resource("owners").get().$promise.then(function(owners) {
                                    device.owners = owners;
                                });
                                devices[device.id] = device;
                            });
                            deferred.resolve(devices);
                        });

                        return deferred.promise;
                    }
                },
                access: {
                    authorities: [USER_ROLES.user]
                }
            })

            .state('device', {
                url: "/app/device/:id",
                templateUrl: 'templates/device.html',
                controller: 'DeviceSingleCtrl',
                resolve: {
                  device: function($stateParams, $q, Device) {
                      console.log($stateParams);
                      var deferred = $q.defer();

                      Device.get({id: $stateParams.id}, function (device) {


                          device.resource("tracks").query({
                              fromDate: $stateParams.fromDate,
                              toDate: $stateParams.toDate
                          }).$promise.then(function (tracks) {
                                  device.tracks = tracks;
                                  deferred.resolve(device);
                              });
                      });

                      return deferred.promise;
                  }
                },
                access: {
                    authorities: [USER_ROLES.user]
                }
            })

            .state('app.account', {
                url: "/account",
                views: {
                    'menuContent': {
                        templateUrl: "templates/account.html",
                        controller: 'AccountCtrl'
                    }
                },
                access: {
                    authorities: [USER_ROLES.user]
                }
            })


            .state('app.password', {
                url: "/password",
                views: {
                    'menuContent': {
                        templateUrl: "templates/password.html",
                        controller: 'PasswordCtrl'
                    }
                },
                access: {
                    authorities: [USER_ROLES.user]
                }
            })

            .state('error', {
                url: '/error',
                access: {
                    authorities: [USER_ROLES.all]
                }
            });

        $urlRouterProvider.otherwise('app/home');

        gravatarServiceProvider.secure = true;

        HateoasInterceptorProvider.transformAllResponses();
        httpHeaders = $httpProvider.defaults.headers;
        localStorageServiceProvider.setPrefix("CarCloud");

    })

    .run(function ($ionicPlatform, $rootScope, $location, $http, AuthenticationService, Session, USER_ROLES,
                   Token, $cordovaNetwork, $cordovaDialogs) {

        $ionicPlatform.ready(function () {

            if(navigator.connection) {
                if($cordovaNetwork.isOffline()) {
                    $cordovaDialogs.alert('No internet connection was found. Please try again when you have internet.', 'No connection detected', 'Exit')
                        .then(function() {
                            navigator.app.exitApp();
                        });
                }
            }

            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

        });

        $rootScope.userRoles = USER_ROLES;

        $rootScope.$on('$stateChangeStart', function (event, next) {

            $rootScope.authenticated = !!Session.get();
            $rootScope.account = Session.get();

            $rootScope.isAuthorized = AuthenticationService.isAuthorized;

            if (Token.get()) {
                httpHeaders.common['Authorization'] = 'Bearer ' + Token.get().accessToken;
            }

            AuthenticationService.valid(next.access.authorities);
        });

        // Call when the the client is confirmed
        $rootScope.$on('event:auth-loginConfirmed', function (data) {
            $rootScope.authenticated = true;
            if ($location.path() === "/login") {
                var search = $location.search();
                if (search.redirect !== undefined) {
                    $location.path(search.redirect).search('redirect', null).replace();
                } else {
                    $location.path('/').replace();
                }
            }
        });

        // Call when the 401 response is returned by the server
        $rootScope.$on('event:auth-loginRequired', function (rejection) {
            Token.invalidate();
            Session.invalidate();
            if ($location.path() !== "/" && $location.path() !== "" && $location.path()
                !== "/register"
                && $location.path() !== "/login") {
                var redirect = $location.path();
                $location.path('/login').search('redirect', redirect).replace();
            }
        });

        // Call when the 403 response is returned by the server
        $rootScope.$on('event:auth-notAuthorized', function (rejection) {
            $rootScope.errorMessage = 'Not authorized.';
            $location.path('/error');
        });

        // Call when the user logs out
        $rootScope.$on('event:auth-loginCancelled', function () {
            $location.path('');
        });
    });
