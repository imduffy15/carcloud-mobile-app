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

    $scope.device = device;


    $scope.onChangeDate = function () {
        var dateFormat = 'yyyy-MM-dd';
        var fromDate = $filter('date')($scope.fromDate, dateFormat);
        var toDate = $filter('date')($scope.toDate, dateFormat);

        device.resource("tracks").query({
            'fromDate': '2014-12-12',
            'toDate': '2015-12-12'
        }).$promise.then(function (tracks) {
                device.tracks = tracks;
                console.log(device);
                addMarkers();
            });
    };

$scope.onChangeDate();

    var addMarkers = function () {

        var polyLineCoordinates = [];
        var mapOptions = {
            zoom: 8,
            center: new google.maps.LatLng(53, -8)
        };

        $scope.markers = [];
        $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        var infoWindow = new google.maps.InfoWindow({maxWidth: 350});

        if (device.tracks.length > 0) {

            var createMarker = function (track) {
                var marker = new google.maps.Marker({
                    map: $scope.map,
                    position: new google.maps.LatLng(track.latitude, track.longitude),
                    title: 'Track ' + track.id
                });
                polyLineCoordinates.push(marker.position);

                marker.content = '<div class="infoWindowContent">';

                marker.content = marker.content + '<p>longitude: ' + track.longitude + '</p>';
                marker.content = marker.content + '<p>latitude: ' + track.latitude + '</p>';
                marker.content = marker.content + '<p>Recorded at: ' + new Date(track.recordedAt) + '</p>';


                if (track.fields.length > 0) {
                    marker.content = marker.content + '<table><tr><th>Name</th><th>Value</th></tr>';

                    angular.forEach(track.fields, function (field) {
                        marker.content = marker.content + '<tr><td>' + field.name + '</td><td>' + field.value + '</td></tr>';
                    });
                }

                marker.content = marker.content + '</table></div>';

                google.maps.event.addListener(marker, 'click', function () {
                    infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
                    infoWindow.open($scope.map, marker);
                });

                $scope.markers.push(marker);

            };

            angular.forEach(device.tracks, function (track) {
                createMarker(track);
            });

            $scope.map.setCenter($scope.markers[Math.round(($scope.markers.length - 1) / 2)].position);

            var path = new google.maps.Polyline({
                path: polyLineCoordinates
            });
            path.setMap($scope.map);
        }


    };

    addMarkers();

    $scope.openInfoWindow = function (e, selectedMarker) {
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }


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
        $scope.addDeviceModal.remove();
        $scope.editDeviceModal.remove();
        $scope.shareDeviceModal.remove();
        $scope.popover.remove();
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
