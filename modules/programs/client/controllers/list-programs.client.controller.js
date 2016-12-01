(function () {
	'use strict';

	angular.module('programs').controller('ProgramsListController', ['ProgramsService', 'Authentication', function (ProgramsService, Authentication) {
		var vm      = this;
		console.log ('authentication user = ', Authentication.user);
		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.programs = ProgramsService.query();
	}]);
}());
