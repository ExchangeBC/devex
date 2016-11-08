(function () {
	'use strict';
	angular.module('programs')
	// =========================================================================
	//
	// Controller for all views of the program detail page
	//
	// =========================================================================
	.controller('ProgramsController', function ($scope, $state, $window, program, Authentication, Notification) {
		var vm = this;

		vm.program = program;
		vm.authentication = Authentication;
		vm.form = {};
		vm.remove = remove;
		vm.save = save;

		// Remove existing program
		function remove() {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.program.$remove(function() {
					$state.go('programs.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> program deleted successfully!' });
				});
			}
		}

		// Save program
		function save(isValid) {
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
				return false;
			}

			// Create a new program, or update the current instance
			vm.program.createOrUpdate()
				.then(successCallback)
				.catch(errorCallback);

			function successCallback(res) {
				$state.go('admin.projects.list'); // should we send the User to the list or the updated program's view?
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> program saved successfully!' });
			}

			function errorCallback(res) {
				Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> program save error!' });
			}
		}
	});
}());
