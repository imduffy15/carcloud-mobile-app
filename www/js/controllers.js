'use strict';

/* Controllers */

carcloudApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
});

carcloudApp.controller('HomeCtrl', function ($scope) {
});

carcloudApp.controller('LoginCtrl', function ($scope, AuthenticationSharedService) {

    $scope.login = function(username, password) {
        AuthenticationSharedService.login({
            username: username,
            password: password
        });
    }

});