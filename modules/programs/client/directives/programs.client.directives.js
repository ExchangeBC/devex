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
			templateUrl  : 'modules/programs/client/views/list.programs.directive.html',
			controller   : function ($scope, ProgramsService, Authentication) {
				var vm = this;
				console.log ('inside directive', Authentication);
				vm.programs = ProgramsService.query ();
			}
		}
	})
	;
}());
