(function () {
	'use strict';

	angular.module('activities').controller('ActivitiesListController', ['ActivitiesService', 'Authentication', function (ActivitiesService, Authentication) {
		var vm      = this;
		console.log ('authentication user = ', Authentication.user);
		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.activities = ActivitiesService.query();
	}]);
}());
