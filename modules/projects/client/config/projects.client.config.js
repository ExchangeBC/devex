(function () {
	'use strict';

	angular.module('projects').run(['MenuService', function (MenuService) {
		MenuService.addMenuItem ('topbar', {
			title: 'Projects',
			state: 'projects.list',
			roles: ['*'],
			icon: 'none',
			position: 2
		});
	}]);

}());
