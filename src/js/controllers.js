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

    $scope.openEditDeviceModal = function () {
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

    $scope.update = function (form) {
        Device.update(form.device, function () {
            $scope.devices[form.device.id] = form.device;
            $scope.closeEditDeviceModal();
        });
    };

    $scope.edit = function (id) {
        $scope.device = $scope.devices[id];
        $scope.openEditDeviceModal();
    };

    $scope.delete = function (id) {
        Device.delete({id: id}, function () {
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

carcloudApp.controller('AccountCtrl', function ($scope, $rootScope, $cordovaDialogs, Account, Session) {

    $scope.form = $rootScope.account;

    $scope.update = function() {
        Account.update($scope.form, function () {
            Account.get().$promise.then(function (data) {
                    $scope.settingsAccount = data;
                    Session.set(
                        $scope.settingsAccount.username,
                        $scope.settingsAccount.firstName,
                        $scope.settingsAccount.lastName,
                        $scope.settingsAccount.email
                    );
                    $cordovaDialogs.alert('Account Successfully Updated', 'Success', 'OK');
                });
        });
    }

});


carcloudApp.controller('LoginCtrl', function ($scope, AuthenticationService) {

    $scope.form = {};

    $scope.login = function () {
        AuthenticationService.login({
            username: $scope.form.username,
            password: $scope.form.password
        });
    }

});

carcloudApp.controller('LogoutController', function ($location, AuthenticationService) {
    AuthenticationService.logout();
    $location.path('/login');
});
