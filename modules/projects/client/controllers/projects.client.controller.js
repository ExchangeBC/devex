(function () {
	'use strict';
	angular.module('projects')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('ProjectsListController', function (ProjectsService) {
		var vm      = this;
		vm.projects = ProjectsService.query();
	})
	// =========================================================================
	//
	// Controller the view of the project page
	//
	// =========================================================================
	.controller('ProjectViewController', function ($scope, $state, $stateParams, project, Authentication, ProjectsService, Notification) {
		var vm             = this;
		vm.programId       = project.program ? project.program._id : $stateParams.programId;
		vm.project         = project;
		vm.authentication  = Authentication;
		vm.ProjectsService = ProjectsService;
		vm.idString        = 'projectId';
		vm.showMember      = Authentication.user && project.userIs.gov && !project.userIs.member && !project.userIs.request;
		vm.request         = function () {
			ProjectsService.makeRequest({
				projectId: project._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
			});
		};
	})
	// =========================================================================
	//
	// Controller the view of the project page
	//
	// =========================================================================
	.controller('ProjectEditController', function ($scope, $state, $stateParams, $window, project, editing, programs, Authentication, Notification) {
		var vm             = this;
		vm.project         = project;
		vm.authentication  = Authentication;
		vm.form            = {};
		vm.project.taglist = vm.project.tags? vm.project.tags.join (', ') : '';
		vm.editing         = editing;
		vm.context         = $stateParams.context;
		vm.programs        = programs;
		//
		// if adding we care about the context
		// if editing, the program field is locked (and is just a link)
		// if adding then the user is restricted to add under a program they have
		// admin over. If adding wihin the context of a program then restrict to
		// that program only
		//
		//
		// defaults
		//
		vm.programLink  = true;
		vm.programId    = $stateParams.programId;
		vm.programTitle = $stateParams.programTitle;
		//
		// if editing, set from existing
		//
		if (vm.editing) {
			vm.programId    = project.program._id;
			vm.programTitle = project.program.title;
		} else {
			//
			// if adding with no program context display select box
			//
			if (vm.context === 'allprojects') {
				vm.programLink = false;
			}
			//
			// if adding with program context set the program on the record
			//
			else if (vm.context === 'program') {
				vm.project.program = vm.programId;
			}
		}
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
			vm.project.tags = vm.project.taglist.split(/ *, */);
			//
			// if we were adding, then set the selected programId, unless it was adding inside
			// a program context already, then just use the one that is already set
			//
			if (!editing && vm.context === 'allprojects') {
				vm.project.program = vm.programId;
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
