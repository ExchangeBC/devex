(function () {
	'use strict';
	angular.module ('orgs')
	// -------------------------------------------------------------------------
	//
	// directive for listing orgs
	//
	// -------------------------------------------------------------------------
	.directive ('orgList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {},
			templateUrl  : '/modules/orgs/client/views/list.orgs.directive.html',
			controller   : function ($scope, $sce, OrgsService, Authentication, Notification) {
				var vm = this;
				var isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
				vm.isAdmin = isAdmin;
				vm.isGov = isGov;
				vm.userCanAdd = (isAdmin || !isGov);
				vm.orgs = OrgsService.query ();
				vm.trust = $sce.trustAsHtml;

			}
		}
	})
	;
}());
