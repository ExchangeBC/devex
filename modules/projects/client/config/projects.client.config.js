(function () {
	'use strict';

	angular.module('projects').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Projects',
			state: 'projects.list',
			roles: ['*'],
			icon: 'fa fa-pie-chart',
			position: 2
		});
	}]);

}());
