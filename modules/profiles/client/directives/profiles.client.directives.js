(function () {
	'use strict';
	angular.module ('profiles')
	// -------------------------------------------------------------------------
	//
	// directive for listing profiles
	//
	// -------------------------------------------------------------------------
	.directive ('profileList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {},
			templateUrl  : '/modules/profiles/client/views/list.profiles.directive.html',
			controller   : function ($scope, ProfilesService, Authentication, Notification) {
				var vm = this;
				var isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
				vm.isAdmin = isAdmin;
				vm.isGov = isGov;
				vm.profiles = ProfilesService.query ();
			}
		}
	})
	;
}());
