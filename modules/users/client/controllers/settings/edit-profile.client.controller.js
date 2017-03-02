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
      // if changes to government flag ...
      //
      if (!wasGov) {
        if (vm.isgov) {
          vm.user.addRequest = true;
          vm.user.removeRequest = false;
        } else {
          vm.user.addRequest = false;
          vm.user.removeRequest = true;
        }
      }
      var govRequest = vm.user.addRequest;
      var successMessage = '<h4>Edit profile successful</h4>';
      if (govRequest) {
        successMessage += '<p>You have requested government user access, the request is now posted for review. You will receive the goverment access and be able to access gov user functionality as soon as the admin verifies you as government user.</p>';
      }
      if (vm.user.notifyOpportunities) {
        successMessage += '<p>We will send you notifications of new Code With Us Opportunities.</p>';
      }
      if (vm.user.notifyEvents) {
        successMessage += '<p>We will notify you of upcoming events.</p>';
      }
      if (vm.user.notifyBlogs) {
        successMessage += '<p>We will notify you of new blog posts.</p>';
      }
      var user = new UsersService(vm.user);
      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        Notification.success({ delay:5000, message: '<i class="glyphicon glyphicon-ok"></i> '+successMessage});
        Authentication.user = response;
      }, function (response) {
        Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit profile failed!' });
      });
    }
  }
}());
