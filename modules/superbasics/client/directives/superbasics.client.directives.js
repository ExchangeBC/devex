(function () {
	'use strict';
	angular.module ('superbasics')
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
				title       : '@',
				context     : '@',
				superbasics : '=',
				canadd      : '='
			},
			templateUrl  : '/modules/superbasics/client/views/list.superbasics.directive.html',
			controller   : function ($rootScope, $scope, SuperbasicsService, Authentication, Notification) {
				var vm         = this;
				vm.title       = ($scope.title) ? $scope.title : null;
				vm.canAdd      = ($scope.canadd) ? $scope.canadd : false;
				vm.context     = $scope.context;
				vm.superbasics = $scope.superbasics;
				$rootScope.$on ('updateSuperbasics', function () {
					vm.superbasics = SuperbasicsService.query ();
				});
			}
		}
	})
	;
}());

