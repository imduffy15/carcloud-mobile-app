'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal) {

});

carcloudApp.controller('DeviceCtrl', function ($scope, $ionicModal, Device, User, devices) {

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

    $ionicModal.fromTemplateUrl('templates/share-device-modal.html', {
        scope: $scope,
        animation: 'slide-left-right'
    }).then(function (modal) {
        $scope.shareDeviceModal = modal
    });

    $scope.create = function () {
        $scope.device = {};
        $scope.addDeviceModal.show()
    };

    $scope.edit = function (id) {
        $scope.device = $scope.devices[id];
        $scope.editDeviceModal.show()
    };

    $scope.share = function (id) {
        $scope.device = $scope.devices[id];
        $scope.shareDeviceModal.show()
    };

    $scope.delete = function (id) {
        Device.delete({id: id}, function () {
            delete $scope.devices[id];
        })
    };

    $scope.$on('$destroy', function () {
        $scope.addDeviceModal.remove();
        $scope.editDeviceModal.remove();
        $scope.shareDeviceModal.remove();
    });


});

carcloudApp.controller('DeviceSingleCtrl', function ($scope, $ionicPopover, $ionicModal, $state, $filter, Device, device) {


    var div = document.getElementById("map_canvas");
    var map = plugin.google.maps.Map.getMap(div);

    $scope.device = device;


    $scope.onChangeDate = function() {

        var dateFormat = 'yyyy-MM-dd';
        var fromDate = $filter('date')($scope.fromDate, dateFormat);
        var toDate = $filter('date')($scope.toDate, dateFormat);

        device.resource("tracks").query({
            'fromDate': fromDate,
            'toDate': toDate
        }).$promise.then(function (tracks) {
                device.tracks = tracks;
                map.clear();
                addMarkers();
            });

    };

    var addMarkers = function () {
        angular.forEach(device.tracks, function (track) {

            var fields = "";

            if (track.fields.length > 0) {
                fields = "Name\t\t\tValue\n";
                angular.forEach(track.fields, function (field) {
                    fields = fields + field.name + "\t\t\t" + field.value + "\n";
                });
            }

            var snippet = "Longitude: " + track.longitude + "\n";
            snippet = snippet + "Latitude: " + track.latitude + "\n";
            snippet = snippet + "Recorded at: " + new Date(track.recordedAt) + "\n";

            snippet = snippet + fields;

            map.addMarker({
                'position': new plugin.google.maps.LatLng(track.latitude, track.longitude),
                'title': 'Track ' + track.id,
                'snippet': snippet
            })

        });
    };

    addMarkers();

    $ionicPopover.fromTemplateUrl('templates/device-popover.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.popover = popover;
    });

    $scope.openPopover = function($event) {
        map.setClickable(false);
        $scope.popover.show($event);
    };

    $scope.closePopover = function() {
        $scope.popover.hide();
    };

    $scope.$on('popover.hidden', function() {
        map.setClickable(true);
    });

    $scope.$on('popover.removed', function() {
        map.setClickable(true);
    });

    $scope.$on('$destroy', function() {
        $scope.addDeviceModal.remove();
        $scope.editDeviceModal.remove();
        $scope.shareDeviceModal.remove();
        $scope.popover.remove();
        map.remove();
    });

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

    $scope.edit = function () {
        $scope.editDeviceModal.show()
    };

    $scope.share = function () {
        $scope.shareDeviceModal.show()
    };

    $scope.delete = function () {
        Device.delete({id: $scope.device.id}, function() {
            $state.transitionTo('app.home', {}, {'reload': true});
        });
    };

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


carcloudApp.controller('shareDeviceCtrl', function ($scope, User) {

    $scope.users = [];

    $scope.getUsers = function (username) {
        User.get({'username': username}).$promise.then(function(users) {
            $scope.users = users;
        });
    };

    $scope.search = {};

    $scope.addOwner = function () {
        $scope.device.resource("owners").save($scope.search.selected.username,
            function () {
                $scope.device.resource("owners").get().$promise.then(function (owners) {
                    angular.forEach(owners,
                        function (value,
                                  key) {
                            if (!$scope.device.owners[key]) {
                                $scope.device.owners[key] =
                                    value;
                            }
                        });
                    $scope.search.selected = undefined;
                });
            });
    };

    $scope.removeOwner = function(username) {
        $scope.device.resource("owners").delete({id: username}).$promise.then(function (success) {
            delete $scope.device.owners[username];
        });
    };

});

carcloudApp.controller('createDeviceCtrl', function ($scope, Device) {

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


});

carcloudApp.controller('editDeviceCtrl', function ($scope, Device) {

    $scope.update = function (form) {
        Device.update(form.device, function () {
            $scope.devices[form.device.id] = form.device;
            $scope.editDeviceModal.hide();
        });
    };
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
