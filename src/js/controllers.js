'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
});

carcloudApp.controller('DeviceCtrl', function ($scope, $ionicModal) {

    $ionicModal.fromTemplateUrl('templates/add-device-modal.html', {
        scope: $scope,
        animation: 'slide-left-right'
    }).then(function(modal) {
        $scope.modal = modal
    });

    $scope.openAddDeviceModal = function() {
        $scope.modal.show()
    };

    $scope.closeAddDeviceModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

});

carcloudApp.controller('DeviceSingleCtrl', function ($scope) {
});

carcloudApp.controller('AccountCtrl', function ($scope) {
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
