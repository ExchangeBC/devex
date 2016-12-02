(function () {
	'use strict';
	angular.module ('activities')
	// -------------------------------------------------------------------------
	//
	// directive for listing activities
	//
	// -------------------------------------------------------------------------
	.directive ('projectList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '='
			},
			templateUrl  : '/modules/activities/client/views/list.activities.directive.html',
			controller   : function ($scope, ActivitiesService, Authentication) {
				var vm = this;
				console.log ('inside directive', Authentication);
				if ($scope.program) {
					vm.activities = ActivitiesService.forProgram ({
						programId: $scope.program._id
					});
				} else {
					vm.activities = ActivitiesService.query ();
				}
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing activity members
	//
	// -------------------------------------------------------------------------
	.directive ('activityMemberList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				activity: '='
			},
			templateUrl  : '/modules/activities/client/views/activity.members.directive.html',
			controller   : function ($scope, $rootScope, ActivitiesService, Authentication) {
				console.log ('Here we are in this directive and activity._id = ',$scope.activity._id);
				var vm = this;
				vm.activity = $scope.activity;
				var reset = function () {
					ActivitiesService.getMembers ({
						activityId: $scope.activity._id
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
					ActivitiesService.denyMember ({
						activityId: $scope.activity._id,
						userId: userid
					}).$promise.then (function () {
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				$rootScope.$on('updateMembers', function (event, message) {
					reset ();
				});
				reset ();
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing activity member requests
	//
	// -------------------------------------------------------------------------
	.directive ('activityMemberRequests', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				activity: '='
			},
			templateUrl  : '/modules/activities/client/views/activities.requests.directive.html',
			controller   : function ($scope, $rootScope, ActivitiesService, Authentication) {
				var vm = this;
				vm.activity = $scope.activity;
				var reset = function () {
					ActivitiesService.getRequests ({
						activityId: $scope.activity._id
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
					ActivitiesService.confirmMember ({
						activityId: $scope.activity._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				vm.deny = function (userid, username) {
					console.log ('deny user ', username, userid);
					ActivitiesService.denyMember ({
						activityId: $scope.activity._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				$rootScope.$on('updateMembers', function (event, message) {
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
