(function () {
  'use strict';

	angular.module('projects').controller('ProjectsListController', ['ProjectsService', 'Authentication', function (ProjectsService, Authentication) {
		var vm = this;
		vm.isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.projects = ProjectsService.query();
	}]);
}());
