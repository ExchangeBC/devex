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
				program: '='
			},
			templateUrl  : '/modules/projects/client/views/list.projects.directive.html',
			controller   : function ($scope, ProjectsService, Authentication) {
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
			}
		}
	})
	;
}());
