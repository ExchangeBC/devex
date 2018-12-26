(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangePasswordController', ChangePasswordController);

  ChangePasswordController.$inject = ['$scope', '$http', 'authenticationService', 'UsersService', 'PasswordValidator', 'Notification'];

  function ChangePasswordController($scope, authenticationService, UsersService, PasswordValidator, Notification) {
    var vm = this;

    vm.user = authenticationService.user;
    vm.changeUserPassword = changeUserPassword;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;

    // Change user password
    function changeUserPassword(isValid) {

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.passwordForm');

        return false;
      }

      UsersService.changePassword(vm.passwordDetails)
        .then(onChangePasswordSuccess)
        .catch(onChangePasswordError);
    }

    function onChangePasswordSuccess() {
      // If successful show success message and clear form
      Notification.success({ message: '<i class="fas fa-check-circle"></i> Password Changed Successfully' });
      vm.passwordDetails = null;
    }

    function onChangePasswordError(response) {
      Notification.error({ message: response.data.message, title: '<i class="fas fa-exclamation-triangle"></i> Password change failed!' });
    }
  }
}());
