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
				var vm = this;
				console.log ('inside directive, program = ', $scope.program);
				if ($scope.program) {
					vm.programId = $scope.program._id;
					vm.projects = ProjectsService.forProgram ({
						programId: $scope.program._id
					});
				} else {
					vm.programId = null;
					vm.projects = ProjectsService.query ();
				}
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing project members
	//
	// -------------------------------------------------------------------------
	.directive ('projectMemberList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				project: '='
			},
			templateUrl  : '/modules/projects/client/views/project.members.directive.html',
			controller   : function ($scope, $rootScope, ProjectsService, Authentication) {
				console.log ('Here we are in this directive and project._id = ',$scope.project._id);
				var vm = this;
				vm.project = $scope.project;
				var reset = function () {
					ProjectsService.getMembers ({
						projectId: $scope.project._id
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
					ProjectsService.denyMember ({
						projectId: $scope.project._id,
						userId: userid
					}).$promise.then (function () {
						$rootScope.$broadcast('updateProjectMembers', 'done');
					});
				};
				$rootScope.$on('updateProjectMembers', function (event, message) {
					reset ();
				});
				reset ();
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing project member requests
	//
	// -------------------------------------------------------------------------
	.directive ('projectMemberRequests', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				project: '='
			},
			templateUrl  : '/modules/projects/client/views/projects.requests.directive.html',
			controller   : function ($scope, $rootScope, ProjectsService, Authentication) {
				var vm = this;
				vm.project = $scope.project;
				var reset = function () {
					ProjectsService.getRequests ({
						projectId: $scope.project._id
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
					ProjectsService.confirmMember ({
						projectId: $scope.project._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateProjectMembers', 'done');
					});
				};
				vm.deny = function (userid, username) {
					console.log ('deny user ', username, userid);
					ProjectsService.denyMember ({
						projectId: $scope.project._id,
						userId: userid
					}).$promise.then (function () {
						// reset ();
						$rootScope.$broadcast('updateProjectMembers', 'done');
					});
				};
				$rootScope.$on('updateProjectMembers', function (event, message) {
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
