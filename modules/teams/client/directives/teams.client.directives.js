(function () {
	'use strict';
	angular.module ('teams')
	// -------------------------------------------------------------------------
	//
	// add or update a team
	//
	// -------------------------------------------------------------------------
	.directive ('editTeam', function () {
		return {
			scope: {
				org: '=',
				team: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			template : '<button class="btn btn-sm btn-default" ng-click="wsx.edit()">Edit Team</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, TeamsService) {
				var wsx = this;
				wsx.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/teams/client/views/edit-team.client.view.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: 'TeamEditController',
						resolve: {
							org: function () {
								return wsx.org;
							},
							team: function (TeamsService) {
								return wsx.team;
							},
							allusers: function (UsersService) {
								return UsersService.query ().$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateTeams', 'done');
					})
					;
				}
			}
		};

	})
	.directive ('addTeam', function (TeamsService) {
		return {
			scope: {
				org: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-sm btn-success" ng-click="wsx.edit()">Add Team</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, TeamsService) {
				var wsx = this;
				console.log ('wsx add team:', wsx);
				var pteam = wsx.team;
				wsx.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/teams/client/views/edit-team.client.view.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: 'TeamEditController',
						resolve: {
							org: function () {
								return wsx.org;
							},
							team: function (TeamsService) {
								return new TeamsService ();
							},
							allusers: function (UsersService) {
								return UsersService.query ().$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateTeams', 'done');
					})
					;
				}
			}
		};

	})
	.directive ('pickTeam', function (TeamsService) {
		return {
			scope: {
				org: '='
			},
			controllerAs: 'rfv',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-sm btn-success" ng-click="rfv.edit()">Choose Team</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, TeamsService) {
				var rfv = this;
				console.log ('rfv choose team:', rfv);
				var inputOrg = rfv.org;
				rfv.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/teams/client/views/pick-team.client.view.html',
						controllerAs: 'lll',
						bindToController: true,
						controller: 'TeamPickController',
						resolve: {
							org: function () {
								return inputOrg;
							},
							team: function (TeamsService) {
								return TeamsService.forOrg({orgId:inputOrg}).$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateTeams', 'done');
					})
					;
				}
			}
		};

	})
	// -------------------------------------------------------------------------
	//
	// directive for listing teams
	//
	// -------------------------------------------------------------------------
	.directive ('teamList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				org: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/teams/client/views/list.teams.directive.html',
			controller   : function ($rootScope, $scope, TeamsService, Authentication, Notification) {
				var vm     = this;
				vm.org = $scope.org;
				vm.context = $scope.context;
				vm.teams = TeamsService.forOrg({orgId:vm.org._id});
				if ($scope.title) vm.title = $scope.title;
				vm.columnCount = 1;
				console.log ('teams', vm.teams, vm.context);
				$rootScope.$on('updateTeams', function () {
					vm.teams = TeamsService.forOrg({orgId:vm.org._id});
				});
			}
		}
	})
	;
}());

