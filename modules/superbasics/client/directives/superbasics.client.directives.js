(function () {
	'use strict';
	angular.module ('superbasics')
	// -------------------------------------------------------------------------
	//
	// add or update a superbasic
	//
	// -------------------------------------------------------------------------
	.directive ('editSuperbasic', function () {
		return {
			scope: {
				org: '=',
				superbasic: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			template : '<button class="btn btn-sm btn-default" ng-click="wsx.edit()">Edit Superbasic</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, SuperbasicsService) {
				var wsx = this;
				wsx.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/superbasics/client/views/edit-superbasic.client.view.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: 'SuperbasicEditController',
						resolve: {
							org: function () {
								return wsx.org;
							},
							superbasic: function (SuperbasicsService) {
								return wsx.superbasic;
							},
							allusers: function (UsersService) {
								return UsersService.query ().$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateSuperbasics', 'done');
					})
					;
				}
			}
		};

	})
	.directive ('addSuperbasic', function (SuperbasicsService) {
		return {
			scope: {
				org: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-sm btn-success" ng-click="wsx.edit()">Add Superbasic</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, SuperbasicsService) {
				var wsx = this;
				console.log ('wsx add superbasic:', wsx);
				var psuperbasic = wsx.superbasic;
				wsx.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/superbasics/client/views/edit-superbasic.client.view.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: 'SuperbasicEditController',
						resolve: {
							org: function () {
								return wsx.org;
							},
							superbasic: function (SuperbasicsService) {
								return new SuperbasicsService ();
							},
							allusers: function (UsersService) {
								return UsersService.query ().$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateSuperbasics', 'done');
					})
					;
				}
			}
		};

	})
	.directive ('pickSuperbasic', function (SuperbasicsService) {
		return {
			scope: {
				org: '='
			},
			controllerAs: 'rfv',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-sm btn-success" ng-click="rfv.edit()">Choose Superbasic</button>',
			controller: function ($rootScope, $scope, $uibModal, Authentication, UsersService, SuperbasicsService) {
				var rfv = this;
				console.log ('rfv choose superbasic:', rfv);
				var inputOrg = rfv.org;
				rfv.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/superbasics/client/views/pick-superbasic.client.view.html',
						controllerAs: 'lll',
						bindToController: true,
						controller: 'SuperbasicPickController',
						resolve: {
							org: function () {
								return inputOrg;
							},
							superbasic: function (SuperbasicsService) {
								return SuperbasicsService.forOrg({orgId:inputOrg}).$promise;
							}
						}
					})
					.result.finally (function (r) {
						console.log (r);
						$rootScope.$broadcast('updateSuperbasics', 'done');
					})
					;
				}
			}
		};

	})
	// -------------------------------------------------------------------------
	//
	// directive for listing superbasics
	//
	// -------------------------------------------------------------------------
	.directive ('superbasicList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				org: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/superbasics/client/views/list.superbasics.directive.html',
			controller   : function ($rootScope, $scope, SuperbasicsService, Authentication, Notification) {
				var vm     = this;
				vm.org = $scope.org;
				vm.context = $scope.context;
				vm.superbasics = SuperbasicsService.forOrg({orgId:vm.org._id});
				if ($scope.title) vm.title = $scope.title;
				vm.columnCount = 1;
				console.log ('superbasics', vm.superbasics, vm.context);
				$rootScope.$on('updateSuperbasics', function () {
					vm.superbasics = SuperbasicsService.forOrg({orgId:vm.org._id});
				});
			}
		}
	})
	;
}());

