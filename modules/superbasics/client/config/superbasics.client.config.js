(function () {
	'use strict';

	if (window.features.superbasics) angular.module('superbasics').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Superbasics',
			state: 'superbasics.list',
			roles: ['*'],
			icon: 'fa fa-pie-chart',
			position: 2
		});
	}]);

}());
