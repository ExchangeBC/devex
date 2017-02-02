(function () {
  'use strict';

  angular
    .module('users')
    .controller('EditProfileController', EditProfileController);

  EditProfileController.$inject = ['$scope', '$http', '$location', 'UsersService', 'Authentication', 'Notification'];

  function EditProfileController($scope, $http, $location, UsersService, Authentication, Notification) {
    var vm               = this;
    var isUser           = Authentication.user;
    var wasGov           = isUser && !!~Authentication.user.roles.indexOf ('gov');
    var wasGovRequest    = isUser && !!~Authentication.user.roles.indexOf ('gov-request');
    vm.user              = Authentication.user;
    vm.updateUserProfile = updateUserProfile;

    vm.isgov = (wasGov || wasGovRequest);
    vm.goveditable = !wasGov;

    // Update a user profile
    function updateUserProfile(isValid) {

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }
      //
      // self-selected as gov
      //
      if (vm.isgov) {
        //
        // were not already gov
        //
        if (!wasGov) {
          //
          // were not awaiting gov
          //
          if (!wasGovRequest) {
            vm.user.roles.push ('gov-request');
          }
        }
      }
      else {
        //
        // were not already gov
        //
        if (!wasGov) {
          var roles = [];
          vm.roles.forEach (function (role) {
            if (role !== 'gov-request') roles.push (role);
          });
          vm.roles = roles;
        }
      }
      var user = new UsersService(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Edit profile successful!' });
        Authentication.user = response;
      }, function (response) {
        Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit profile failed!' });
      });
    }
  }
}());
