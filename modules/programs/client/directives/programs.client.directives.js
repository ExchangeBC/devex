(function () {
	'use strict';
	angular.module ('programs')
	// -------------------------------------------------------------------------
	//
	// directive for listing programs
	//
	// -------------------------------------------------------------------------
	.directive ('tmplProgramList', function ($state, $modal, ArtifactModel) {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {},
			templateUrl  : 'modules/programs/client/views/list-programs.client.view.html',
			controller   : function ($scope, ProgramsService) {
				var vm = this;
				vm.programs = ProgramsService.query ();
			}
		}
	})
	;
}());
