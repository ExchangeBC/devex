(function () {
	'use strict';

	angular.module('opportunities').controller('OpportunitiesListController', ['OpportunitiesService', 'Authentication', function (OpportunitiesService, Authentication) {
		var vm      = this;
		console.log ('authentication user = ', Authentication.user);
		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.opportunities = OpportunitiesService.query();
	}]);
}());
