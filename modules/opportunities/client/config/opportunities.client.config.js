(function () {
	'use strict';

	angular.module('programs').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Opportunities',
			state: 'opportunities.list',
			roles: ['*'],
			icon: 'none',
			position: 5
		});
	}]);

}());
