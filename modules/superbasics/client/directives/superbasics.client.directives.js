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
				superbasics : '='
			},
			templateUrl  : '/modules/superbasics/client/views/list.superbasics.directive.html',
			controller   : function ($sce, $rootScope, $scope, SuperbasicsService, Authentication) {
				var vm         = this;
				vm.trust       = $sce.trustAsHtml;
				vm.auth        = Authentication;
				vm.title       = ($scope.title) ? $scope.title : null;
				vm.canAdd      = vm.auth.isAdmin;
				vm.context     = $scope.context;
				vm.superbasics = $scope.superbasics;
				$rootScope.$on ('updateSuperbasics', function () {
					vm.superbasics = SuperbasicsService.query ();
				});
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for viewing a superbasic, could have several different modes
	//
	// -------------------------------------------------------------------------
	.directive ('superbasicView', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				mode       : '@',
				superbasic : '='
			},
			templateUrl  : '/modules/superbasics/client/views/view.superbasic.directive.html',
			controller   : function ($scope, Authentication) {
				var vm        = this;
				vm.auth       = Authentication;
				vm.mode       = $scope.mode || 'page';
				vm.canEdit    = vm.auth.isAdmin;
				vm.superbasic = $scope.superbasic;
			}
		}

	})
	;
}());

