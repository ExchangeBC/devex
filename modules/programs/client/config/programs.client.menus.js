(function () {
	'use strict';

	angular.module('programs').run(['MenuService', function (MenuService) {
		MenuService.addMenuItem ('topbar', {
			title: 'Programs',
			state: 'programs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});
	}]);

}());
