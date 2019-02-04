(function () {
	'use strict';

	angular.module('programs').run(['MenuService', function (MenuService) {
		MenuService.addMenuItem ('topbar', {
			title: 'Opportunities',
			state: 'opportunities.list',
			roles: ['*'],
			icon: 'none',
			position: 5
		});
	}]);

}());
