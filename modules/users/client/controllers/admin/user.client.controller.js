(function () {
  'use strict';

  angular
    .module('users.admin')
    .controller('UserController', UserController);

  UserController.$inject = ['$scope', '$state', '$window', 'Authentication', 'userResolve', 'Notification', 'subscriptions', 'NotificationsService'];

  function UserController($scope, $state, $window, Authentication, user, Notification, subscriptions, NotificationsService) {
    var vm = this;
    vm.subscriptions = subscriptions;
    vm.authentication = Authentication;
    vm.user = user;
    vm.remove = remove;
    vm.update = update;
    vm.isContextUserSelf = isContextUserSelf;

    function remove(user) {
      if ($window.confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          vm.users.splice(vm.users.indexOf(user), 1);
          Notification.success('User deleted successfully!');
        } else {
          vm.user.$remove(function () {
            $state.go('admin.users');
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> User deleted successfully!' });
          });
        }
      }
    }

    function update(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      var user = vm.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> User saved successfully!' });
      }, function (errorResponse) {
        Notification.error({ message: errorResponse.data.message, title: '<i class="glyphicon glyphicon-remove"></i> User update error!' });
      });
    }

    // -------------------------------------------------------------------------
    //
    // remove a subscription
    //
    // -------------------------------------------------------------------------
    vm.unsubscribe = function (subscriptionId) {
      if ($window.confirm('Are you sure you want to unsubscribe this user from this Notification?')) {
        NotificationsService.unsubscribe ({subscriptionId: subscriptionId},  function() {
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> notification deleted successfully!' });
          NotificationsService.subscriptionsForNotification ({
            notificationId: vm.notification._id
          }, function (result) {
            vm.subscriptions = result;
          })
        });
      }
    };

    function isContextUserSelf() {
      return vm.user.username === vm.authentication.user.username;
    }
  }
}());
