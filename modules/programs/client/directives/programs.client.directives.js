(function () {
	'use strict';
	angular.module ('programs')
	// -------------------------------------------------------------------------
	//
	// directive for listing programs
	//
	// -------------------------------------------------------------------------
	.directive ('programList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {},
			templateUrl  : '/modules/programs/client/views/list.programs.directive.html',
			controller   : function ($scope, ProgramsService, Authentication) {
				var vm = this;
				console.log ('inside directive', Authentication);
				vm.programs = ProgramsService.query ();
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing program members
	//
	// -------------------------------------------------------------------------
	.directive ('programMemberList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '='
			},
			templateUrl  : '/modules/programs/client/views/program.members.directive.html',
			controller   : function ($scope, $rootScope, ProgramsService, Authentication) {
				console.log ('Here we are in this directive and program._id = ',$scope.program._id);
				var vm = this;
				vm.program = $scope.program;
				var reset = function () {
					ProgramsService.getMembers ({
						programId: $scope.program._id
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
					ProgramsService.denyMember ({
						programId: $scope.program._id,
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
	// directive for listing program member requests
	//
	// -------------------------------------------------------------------------
	.directive ('programMemberRequests', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '='
			},
			templateUrl  : '/modules/programs/client/views/programs.requests.directive.html',
			controller   : function ($scope, $rootScope, ProgramsService, Authentication) {
				var vm = this;
				vm.program = $scope.program;
				var reset = function () {
					ProgramsService.getRequests ({
						programId: $scope.program._id
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
					ProgramsService.confirmMember ({
						programId: $scope.program._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				vm.deny = function (userid, username) {
					console.log ('deny user ', username, userid);
					ProgramsService.denyMember ({
						programId: $scope.program._id,
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
