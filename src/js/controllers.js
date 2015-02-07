'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
});

carcloudApp.controller('DeviceCtrl', function ($scope, $ionicModal, Device, User, devices) {

    $scope.devices = devices;

    console.log(devices);

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

    $ionicModal.fromTemplateUrl('templates/share-device-modal.html', {
        scope: $scope,
        animation: 'slide-left-right'
    }).then(function (modal) {
        $scope.shareDeviceModal = modal
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

    $scope.openShareDeviceModal = function () {
        $scope.shareDeviceModal.show();
    };

    $scope.closeShareDeviceModal = function () {
        $scope.shareDeviceModal.hide();
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

    $scope.getUsers = function (username) {
        return User.get({'username': username}).$promise;
    };

    $scope.edit = function (id) {
        $scope.device = $scope.devices[id];
        $scope.openEditDeviceModal();
    };

    $scope.share = function (id) {
        $scope.device = $scope.devices[id];
        $scope.openShareDeviceModal();
    };

    $scope.delete = function (id) {
        Device.delete({id: id}, function () {
            delete $scope.devices[id];
        })
    };

    $scope.selectMatch = function(lala) {
        console.log("test");
    };

    $scope.$on('$destroy', function () {
        $scope.addDeviceModal.remove();
        $scope.editDeviceModal.remove();
    });

});

carcloudApp.controller('DeviceSingleCtrl', function ($scope, $ionicPopover) {

    $ionicPopover.fromTemplateUrl('templates/device-popover.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.popover = popover;
    });

    $scope.openPopover = function($event) {
        $scope.popover.show($event);
    };
    $scope.closePopover = function() {
        $scope.popover.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });


});

carcloudApp.controller('AccountCtrl', function ($scope, $rootScope, $cordovaToast, Account, Session) {

    $scope.account = $rootScope.account;

    $scope.update = function(form) {
        Account.update(form.account, function () {
            Account.get().$promise.then(function (data) {
                    Session.set(
                        data.username,
                        data.firstName,
                        data.lastName,
                        data.email
                    );
                    $cordovaToast.show('Account updated', 'short', 'center');
                });
        });
    }

});

carcloudApp.controller('PasswordCtrl', function($scope, $cordovaToast, Account) {
    $scope.account = Account.get();

    $scope.changePassword = function(form) {
        Account.update({
            'password': form.password,
            'version': $scope.account.version
        }, function() {
            $cordovaToast.show('Password updated', 'short', 'center')
        });
    }

});

carcloudApp.controller('LoginCtrl', function ($scope, AuthenticationService) {

    $scope.login = function (form) {
        AuthenticationService.login(form.account);
    }

});

carcloudApp.controller('LogoutController', function ($location, AuthenticationService) {
    AuthenticationService.logout();
    $location.path('/login');
});
