'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
});

carcloudApp.controller('DeviceCtrl', function ($scope, $ionicModal, Device, devices) {

    $scope.devices = devices;

    $ionicModal.fromTemplateUrl('templates/add-device-modal.html', {
        scope: $scope,
        animation: 'slide-left-right'
    }).then(function (modal) {
        $scope.addDeviceModal = modal
    });

    $ionicModal.fromTemplateUrl('templates/edit-device-modal.html', {
        scope: $scope,
        animation: 'slide-left-right'
    }).then(function (modal) {
        $scope.editDeviceModal = modal
    });

    $scope.openAddDeviceModal = function () {
        $scope.device = {};
        $scope.addDeviceModal.show()
    };

    $scope.closeAddDeviceModal = function () {
        $scope.addDeviceModal.hide();
    };

    $scope.openEditDeviceModal = function() {
        $scope.editDeviceModal.show();
    };

    $scope.closeEditDeviceModal = function () {
        $scope.editDeviceModal.hide();
    };

    $scope.create = function (form) {
        Device.save(form.device, function () {
            Device.query().$promise.then(function (devices) {
                angular.forEach(devices, function (device) {
                    if (!$scope.devices[device.id]) {
                        $scope.devices[device.id] = device;
                    }
                });
            })
        });
        $scope.addDeviceModal.hide();
    };

    $scope.edit = function(id) {
        $scope.device = $scope.devices[id];
        $scope.openEditDeviceModal();
    };

    $scope.delete = function(id) {
        Device.delete({id: id}, function() {
            delete $scope.devices[id];
        })
    };

    $scope.$on('$destroy', function () {
        $scope.addDeviceModal.remove();
        $scope.editDeviceModal.remove();
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
