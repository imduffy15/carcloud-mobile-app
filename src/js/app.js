'use strict';

var httpHeaders;

var carcloudApp = angular.module('carcloudApp', ['ionic', 'ngCordova', 'http-auth-interceptor', 'ngResource', 'carcloudAppUtils']);

carcloudApp.config(function ($httpProvider, $stateProvider, $urlRouterProvider, USER_ROLES) {
	$stateProvider
			.state('login', {
				url: '/login',
				templateUrl: 'templates/login.html',
				controller: 'LoginCtrl',
				data: {
					authorizedRoles: [USER_ROLES.all]
				}
			})

			.state('logout', {
				url: '/logout',
				controller: 'LogoutController',
				data: {
					authorizedRoles: [USER_ROLES.all]
				}
			})

			.state('app', {
				url: "/app",
				abstract: true,
				templateUrl: "templates/menu.html",
				controller: 'AppCtrl',
				data: {
					authorizedRoles: [USER_ROLES.all]
				}
			})

			.state('app.home', {
				url: "/home",
				views: {
					'menuContent': {
						templateUrl: "templates/home.html",
						controller: 'HomeCtrl'
					}
				},
				data: {
					authorizedRoles: [USER_ROLES.all]
				}
			})

			.state('app.home2', {
				url: "/home2",
				views: {
					'menuContent': {
						templateUrl: "templates/home.html",
						controller: 'HomeCtrl'
					}
				},
				data: {
					authorizedRoles: [USER_ROLES.all]
				}
			});

	$urlRouterProvider.otherwise('app/home');

	httpHeaders = $httpProvider.defaults.headers;
});

carcloudApp.run(function ($ionicPlatform, $state, $stateParams, $rootScope, $location, AuthenticationSharedService, USER_ROLES, Token) {
	$ionicPlatform.ready(function () {
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


	if (!Token.get('access_token')) {
		$location.path('/login');
	}

	$rootScope.$on('$stateChangeStart',
			function (event, toState, toParams, fromState, fromParams) {
				$rootScope.isAuthorized = AuthenticationSharedService.isAuthorized;

				if (!Token.get('access_token')) {
					$location.path('/login');
				}

				$rootScope.userRoles = USER_ROLES;
				AuthenticationSharedService.valid(toState.data.authorizedRoles);
			}
	);

	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
	$rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
		// to be used for back button //won't work when page is reloaded.
		$rootScope.previousState_name = fromState.name;
		$rootScope.previousState_params = fromParams;
		$rootScope.nowState_name = toState.name;
	});

	//back button function called from back button's ng-click="back()"
	$ionicPlatform.registerBackButtonAction(function () {
		if (!$rootScope.previousState_name || $rootScope.nowState_name == "login" || $rootScope.nowState_name == "app.home") {
			ionic.Platform.exitApp();
		} else {
			$state.go($rootScope.previousState_name, $rootScope.previousState_params);
		}
	}, 100);

	// Call when the the client is confirmed
	$rootScope.$on('event:auth-loginConfirmed', function (data) {
		$rootScope.authenticated = true;
		if ($location.path() === "/login") {
			$location.path('/').replace();
		}
	});

	// Call when the 401 response is returned by the server
	$rootScope.$on('event:auth-loginRequired', function (rejection) {
		AuthenticationSharedService.refresh();
	});

	// Call when the 403 response is returned by the server
	$rootScope.$on('event:auth-notAuthorized', function (rejection) {
		$rootScope.errorMessage = 'errors.403';
		$location.path('/error').replace();
	});

	// Call when the user logs out
	$rootScope.$on('event:auth-loginCancelled', function () {
		$location.path('');
	});
});
