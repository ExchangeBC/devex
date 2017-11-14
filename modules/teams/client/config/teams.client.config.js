(function () {
	'use strict';

	if (window.features.teams) angular.module('teams').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Teams',
			state: 'teams.list',
			roles: ['*'],
			icon: 'fa fa-pie-chart',
			position: 2
		});
	}]);

}());
