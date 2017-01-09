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
				vm.publish = function (opportunity, state) {
					var publishedState = opportunity.isPublished;
					var t = state ? 'Published' : 'Un-Published'
					opportunity.isPublished = state;
					opportunity.createOrUpdate ()
					//
					// success, notify and return to list
					//
					.then (function (res) {
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> Opportunity '+t+' Successfully!'
						});
					})
					//
					// fail, notify and stay put
					//
					.catch (function (res) {
						opportunity.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Opportunity '+t+' Error!'
						});
					});
				};
			}
		}
	})
	;
}());
