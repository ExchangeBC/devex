(function () {
	'use strict';

	angular.module('programs').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Programs',
			state: 'programs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});
	}]);

}());
