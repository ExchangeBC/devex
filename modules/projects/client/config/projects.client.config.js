(function () {
	'use strict';

	angular.module('projects').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Projects',
			state: 'projects.list',
			roles: ['*'],
			icon: 'none',
			position: 2
		});
	}]);

}());
