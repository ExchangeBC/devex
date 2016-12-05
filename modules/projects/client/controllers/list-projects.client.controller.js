(function () {
	'use strict';

	angular.module('projects').controller('ProjectsListController', ['ProjectsService', 'Authentication', function (ProjectsService, Authentication) {
		var vm      = this;
		console.log ('authentication user = ', Authentication.user);
		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.projects = ProjectsService.query();
	}]);
}());
// (function () {
//   'use strict';

// 	angular.module('projects').controller('ProjectsListController', ['ProjectsService', 'Authentication', function (ProjectsService, Authentication) {
// 		var vm = this;
// 		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
// 		vm.projects = ProjectsService.query();
// 	}]);
// }());
