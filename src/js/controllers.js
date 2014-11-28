'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
});

carcloudApp.controller('HomeCtrl', function ($scope) {
});

carcloudApp.controller('LoginCtrl', function ($scope, AuthenticationSharedService) {

	$scope.form = {};

	$scope.login = function () {
		AuthenticationSharedService.login({
			username: $scope.form.username,
			password: $scope.form.password
		});
	}

});

carcloudApp.controller('LogoutController', function ($location, AuthenticationSharedService) {
	AuthenticationSharedService.logout();
	$location.path('/login');
});
