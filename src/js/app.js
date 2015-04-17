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
                                device.resource("owners").get().$promise.then(function (owners) {
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
                    device: function ($stateParams, $q, Device) {
                        console.log($stateParams);
                        var deferred = $q.defer();

                        Device.get({id: $stateParams.id}, function (device) {

                            device.resource("owners").get().$promise.then(function (owners) {
                                device.owners = owners;
                                device.resource("tracks").query({
                                    fromDate: $stateParams.fromDate,
                                    toDate: $stateParams.toDate
                                }).$promise.then(function (tracks) {
                                        device.tracks = tracks;
                                        deferred.resolve(device);
                                    });
                            })
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

            if (navigator.connection) {
                if ($cordovaNetwork.isOffline()) {
                    $cordovaDialogs.alert('No internet connection was found. Please try again when you have internet.', 'No connection detected', 'Exit')
                        .then(function () {
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
    })

    .directive('clickForOptionsWrapper', [function () {
        return {
            restrict: 'A',
            controller: function ($scope) {
                this.closeOptions = function () {
                    $scope.$broadcast('closeOptions');
                }
            }
        };
    }])

    .directive('clickForOptions', ['$ionicGesture', function ($ionicGesture) {
        return {
            restrict: 'A',
            scope: false,
            require: '^clickForOptionsWrapper',
            link: function (scope, element, attrs, parentController) {
                // A basic variable that determines wether the element was currently clicked
                var clicked;

                // Set an initial attribute for the show state
                attrs.$set('optionButtons', 'hidden');

                // Grab the content
                var content = element[0].querySelector('.item-content');

                // Grab the buttons and their width
                var buttons = element[0].querySelector('.item-options');

                var closeAll = function () {
                    element.parent()[0].$set('optionButtons', 'show');
                };

                // Add a listener for the broadcast event from the parent directive to close
                var previouslyOpenedElement;
                scope.$on('closeOptions', function () {
                    if (!clicked) {
                        attrs.$set('optionButtons', 'hidden');
                    }
                });

                // Function to show the options
                var showOptions = function () {
                    // close all potentially opened items first
                    parentController.closeOptions();

                    var buttonsWidth = buttons.offsetWidth;
                    ionic.requestAnimationFrame(function () {
                        // Add the transition settings to the content
                        content.style[ionic.CSS.TRANSITION] = 'all ease-out .25s';

                        // Make the buttons visible and animate the content to the left
                        buttons.classList.remove('invisible');
                        content.style[ionic.CSS.TRANSFORM] = 'translate3d(-' + buttonsWidth + 'px, 0, 0)';

                        // Remove the transition settings from the content
                        // And set the "clicked" variable to false
                        setTimeout(function () {
                            content.style[ionic.CSS.TRANSITION] = '';
                            clicked = false;
                        }, 250);
                    });
                };

                // Function to hide the options
                var hideOptions = function () {
                    var buttonsWidth = buttons.offsetWidth;
                    ionic.requestAnimationFrame(function () {
                        // Add the transition settings to the content
                        content.style[ionic.CSS.TRANSITION] = 'all ease-out .25s';

                        // Move the content back to the original position
                        content.style[ionic.CSS.TRANSFORM] = '';

                        // Make the buttons invisible again
                        // And remove the transition settings from the content
                        setTimeout(function () {
                            buttons.classList.add('invisible');
                            content.style[ionic.CSS.TRANSITION] = '';
                        }, 250);
                    });
                };

                // Watch the open attribute for changes and call the corresponding function
                attrs.$observe('optionButtons', function (value) {
                    if (value == 'show') {
                        showOptions();
                    } else {
                        hideOptions();
                    }
                });

                // Change the open attribute on tap
                $ionicGesture.on('tap', function (e) {
                    clicked = true;
                    if (attrs.optionButtons == 'show') {
                        attrs.$set('optionButtons', 'hidden');
                    } else {
                        attrs.$set('optionButtons', 'show');
                    }
                }, element);
            }
        };
    }]);
