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
				title: '@'
			},
			templateUrl  : '/modules/projects/client/views/list.projects.directive.html',
			controller   : function ($scope, ProjectsService, Authentication, Notification) {
				var vm     = this;
				vm.program = $scope.program;
				//
				// if a program is supplied, then only list projects under it
				// also allow adding a new project (because it has context)
				//
				if ($scope.program) {
					vm.title      = 'Projects for '+$scope.program.title;
					vm.programId  = $scope.program._id;
					vm.userCanAdd = $scope.program.userIs.admin;
					vm.projects   = ProjectsService.forProgram ({
						programId: $scope.program._id
					});
					vm.columnCount = 2;
				} else {
					vm.title      = 'All Projects';
					vm.programId  = null;
					vm.userCanAdd = false;
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
					.then (function (res) {
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
			}
		}
	})
	;
}());
