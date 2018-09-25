(function () {
	'use strict';
	angular.module ('projects')
	// -------------------------------------------------------------------------
	//
	// directive for listing projects
	//
	// -------------------------------------------------------------------------
	.directive ('projectList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/projects/client/views/list.projects.directive.html',
			controller   : ['$scope', 'ProjectsService', 'Authentication', 'Notification', function ($scope, ProjectsService, Authentication, Notification) {
				var vm     = this;
				vm.program = $scope.program;
				vm.context = $scope.context;
				var isUser = Authentication.user;
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
				vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
				if (vm.context === 'program') {
					vm.programId = vm.program._id;
					vm.programTitle = vm.program.title;
				} else {
					vm.programId = null;
					vm.programTitle = null;
				}
				//
				// if a program is supplied, then only list projects under it
				// also allow adding a new project (because it has context)
				//
				if ($scope.program) {
					vm.title      = 'Projects for '+$scope.program.title;
					vm.programId  = $scope.program._id;
					vm.userCanAdd = $scope.program.userIs.admin || vm.isAdmin;
					vm.projects   = ProjectsService.forProgram ({
						programId: $scope.program._id
					});
					vm.columnCount = 1;
				} else {
					vm.title      = 'All Projects';
					vm.programId  = null;
					vm.userCanAdd = (vm.isAdmin || vm.isGov);
					vm.projects   = ProjectsService.query ();
					vm.columnCount = 1;
				}
				if ($scope.title) vm.title = $scope.title;
				vm.publish = function (project, state) {
					var publishedState = project.isPublished;
					var t = state ? 'Published' : 'Un-Published'
					project.isPublished = state;
					project.createOrUpdate ()
					//
					// success, notify and return to list
					//
					.then (function () {
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> Project '+t+' Successfully!'
						});
					})
					//
					// fail, notify and stay put
					//
					.catch (function (res) {
						project.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Project '+t+' Error!'
						});
					});
				};
				vm.request = function (project) {
					ProjectsService.makeRequest ({
						projectId: project._id
					}).$promise
					.then (function () {
						project.userIs.request = true;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
					})
					.catch (function (res) {
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Membership Request Error!'
						});
					});
				};
			}]
		}
	})
	;
}());
