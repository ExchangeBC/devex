(function () {
	'use strict';
	angular.module ('opportunities')
	// -------------------------------------------------------------------------
	//
	// directive for listing opportunities
	//
	// -------------------------------------------------------------------------
	.directive ('opportunityList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				project: '=',
				title: '@'
			},
			templateUrl  : '/modules/opportunities/client/views/list.opportunities.directive.html',
			controller   : function ($scope, OpportunitiesService, Authentication) {
				var vm     = this;
				vm.project = $scope.project;
				//
				// if a project is supplied, then only list opps under it
				// also allow adding a new opp (because it has context)
				//
				if ($scope.project) {
					vm.title         = 'Opportunities for '+$scope.project.name;
					vm.programId     = $scope.project.program ? $scope.project.program._id : null;
					vm.projectId     = $scope.project._id;
					vm.userCanAdd    = $scope.project.userIs.admin;
					vm.opportunities = OpportunitiesService.forProject ({
						projectId: $scope.project._id
					});
				} else {
					vm.title         = 'All Opportunities';
					vm.programId     = null;
					vm.projectId     = null;
					vm.userCanAdd    = false;
					vm.opportunities = OpportunitiesService.query ();
				}
				if ($scope.title) vm.title = $scope.title;
			}
		}
	})
	;
}());
