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
				project: '='
			},
			templateUrl  : '/modules/opportunities/client/views/list.opportunities.directive.html',
			controller   : function ($scope, OpportunitiesService, Authentication) {
				var vm = this;
				console.log ('inside directive, project = ', $scope.project);
				if ($scope.project) {
					vm.projectId = $scope.project._id;
					vm.opportunities = OpportunitiesService.forProject ({
						projectId: $scope.project._id
					});
				} else {
					vm.projectId = null;
					vm.opportunities = OpportunitiesService.query ();
				}
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing opportunity members
	//
	// -------------------------------------------------------------------------
	.directive ('opportunityMemberList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				opportunity: '='
			},
			templateUrl  : '/modules/opportunities/client/views/opportunity.members.directive.html',
			controller   : function ($scope, $rootScope, OpportunitiesService, Authentication) {
				console.log ('Here we are in this directive and opportunity._id = ',$scope.opportunity._id);
				var vm = this;
				vm.opportunity = $scope.opportunity;
				var reset = function () {
					OpportunitiesService.getMembers ({
						opportunityId: $scope.opportunity._id
					}).$promise.then (function (result) {
						vm.members = result;
						console.log ('Members:',result);
						var columnLength = Math.floor (result.length / 2) + (result.length % 2);
						vm.columns = [{
							start : 0,
							end   : columnLength
						},{
							start : columnLength,
							end   : result.length
						}];
					});
				}
				vm.delete = function (userid, username) {
					console.log ('delete user ', username, userid);
					OpportunitiesService.denyMember ({
						opportunityId: $scope.opportunity._id,
						userId: userid
					}).$promise.then (function () {
						$rootScope.$broadcast('updateOpportunityMembers', 'done');
					});
				};
				$rootScope.$on('updateOpportunityMembers', function (event, message) {
					reset ();
				});
				reset ();
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing opportunity member requests
	//
	// -------------------------------------------------------------------------
	.directive ('opportunityMemberRequests', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				opportunity: '='
			},
			templateUrl  : '/modules/opportunities/client/views/opportunities.requests.directive.html',
			controller   : function ($scope, $rootScope, OpportunitiesService, Authentication) {
				var vm = this;
				vm.opportunity = $scope.opportunity;
				var reset = function () {
					OpportunitiesService.getRequests ({
						opportunityId: $scope.opportunity._id
					}).$promise.then (function (result) {
						vm.members = result;
						console.log ('Requests:',result);
						var columnLength = Math.floor (result.length / 2) + (result.length % 2);
						vm.columns = [{
							start : 0,
							end   : columnLength
						},{
							start : columnLength,
							end   : result.length
						}];
					});
				}
				vm.confirm = function (userid, username) {
					console.log ('confirm user ', username, userid);
					OpportunitiesService.confirmMember ({
						opportunityId: $scope.opportunity._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateOpportunityMembers', 'done');
					});
				};
				vm.deny = function (userid, username) {
					console.log ('deny user ', username, userid);
					OpportunitiesService.denyMember ({
						opportunityId: $scope.opportunity._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateOpportunityMembers', 'done');
					});
				};
				$rootScope.$on('updateOpportunityMembers', function (event, message) {
					reset ();
				});
				reset ();
			}
		}
	})
	.filter ('slice', function () {
		return function(arr, start, end) {
			return arr.slice(start, end);
		};
	});
	;
}());
