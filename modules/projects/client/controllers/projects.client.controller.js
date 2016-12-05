(function () {
	'use strict';
	angular.module('projects')
	// =========================================================================
	//
	// Controller the view of the project page
	//
	// =========================================================================
	.controller('ProjectViewController', function ($scope, $state, $stateParams, project, Authentication, ProjectsService) {
		var vm            = this;
		vm.programId      = $stateParams.programId;
		vm.project        = project;
		vm.authentication = Authentication;
		vm.showMember     = project.userIs.gov && !project.userIs.member && !project.userIs.request;
		vm.request = function () {
			ProjectsService.makeRequest({
				projectId: project._id
			}).$promise.then (function () {
				console.log ('Oh yeah, all done');
			})
		};
	})
	// =========================================================================
	//
	// Controller the view of the project page
	//
	// =========================================================================
	.controller('ProjectEditController', function ($scope, $state, $stateParams, $window, project, editing, Authentication, Notification) {
		var vm            = this;
		vm.programId      = $stateParams.programId;
		vm.editing        = editing;
		vm.project        = project;
		if (!vm.editing) {
			vm.project.program = $stateParams.programId;
		}
		vm.authentication = Authentication;
		vm.form           = {};
		// -------------------------------------------------------------------------
		//
		// remove the project with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.project.$remove(function() {
					$state.go('projects.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> project deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the project, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			console.log ('saving form', vm.project);
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
				return false;
			}
			//
			// Create a new project, or update the current instance
			//
			vm.project.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (res) {
				console.log ('now saved the new project, redirect user');
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> project saved successfully!'
				});
				if (editing) {
					$state.go('projects.view', {projectId:project._id});
				} else {
					$state.go('projects.list');
				}
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> project save error!'
				});
			});
		};
	})
	;
}());
// (function () {
// 	'use strict';

// 	// Projects controller
// 	angular.module('projects')
// 		.controller('ProjectsController', ProjectsController);

// 	ProjectsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'projectResolve'];

// 	function ProjectsController ($scope, $state, $window, Authentication, project) {
// 		var vm = this;

// 		vm.authentication = Authentication;
// 		vm.project = project;
// 		vm.error = null;
// 		vm.form = {};
// 		vm.remove = remove;
// 		vm.save = save;

// 		// Remove existing Project
// 		function remove() {
// 			if ($window.confirm('Are you sure you want to delete?')) {
// 				vm.project.$remove($state.go('projects.list'));
// 			}
// 		}

// 		// Save Project
// 		function save(isValid) {
// 			if (!isValid) {
// 				$scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
// 				return false;
// 			}

// 			// TODO: move create/update logic to service
// 			if (vm.project._id) {
// 				vm.project.$update(successCallback, errorCallback);
// 			} else {
// 				vm.project.$save(successCallback, errorCallback);
// 			}

// 			function successCallback(res) {
// 				$state.go('projects.view', {
// 					projectId: res._id
// 				});
// 			}

// 			function errorCallback(res) {
// 				vm.error = res.data.message;
// 			}
// 		}
// 	}
// });
