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
				var isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
				vm.userCanAdd = (isAdmin || isGov);
				vm.programs = ProgramsService.query ();
			}
		}
	})
	;
}());
