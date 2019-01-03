import '../../css/users.css';

(function() {
	'use strict';

	angular.module('users.admin').controller('UserController', UserController);

	UserController.$inject = ['$scope', '$state', '$window', 'AuthenticationService', 'userResolve', 'Notification'];

	function UserController($scope, $state, $window, authenticationService, user, Notification) {
		var vm = this;
		vm.authentication = authenticationService;
		vm.user = user;
		vm.remove = remove;
		vm.update = update;
		vm.cancel = cancel;
		vm.isContextUserSelf = isContextUserSelf;

		function remove(user) {
			if ($window.confirm('Are you sure you want to delete this user?')) {
				if (user) {
					user.$remove();

					vm.users.splice(vm.users.indexOf(user), 1);
					Notification.success('User deleted successfully!');
				} else {
					vm.user.$remove(function() {
						$state.go('admin.users');
						Notification.success({
							message: '<i class="fas fa-check-circle"></i> User deleted successfully!'
						});
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

			user.$update(
				function() {
					$state.go('admin.user', {
						userId: user._id
					});
					Notification.success({
						message: '<i class="fas fa-2x fa-check-circle"></i><br><h4>Changes saved!</h4>'
					});
				},
				function(errorResponse) {
					Notification.error({
						message: errorResponse.data.message,
						title: '<i class="fas fa-2x fa-exclamation-triangle"></i><br><h4>User update error!</h4>'
					});
				}
			);
		}

		function cancel() {
			$state.go('admin.user', {
				userId: user._id
			});
		}

		function isContextUserSelf() {
			return vm.user.username === vm.authentication.user.username;
		}
	}
}());
