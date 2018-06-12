(function () {
	'use strict';

	angular.module('orgs').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Companies',
			state: 'orgs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});
	}]);

}());
