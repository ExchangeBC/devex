(function () {
	'use strict';

	angular.module('programs').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Programs',
			state: 'programs.list',
			roles: ['*']
		});
	}]);

	// angular
	// 	.module('programs')
	// 	.run(menuConfig);

	// menuConfig.$inject = ['menuService'];

	// function menuConfig(menuService) {
	// 	menuService.addMenuItem('topbar', {
	// 		title: 'Programs',
	// 		state: 'programs',
	// 		type: 'dropdown',
	// 		roles: ['*']
	// 	});

	// 	// Add the dropdown list item
	// 	menuService.addSubMenuItem('topbar', 'programs', {
	// 		title: 'List Programs',
	// 		state: 'programs.list',
	// 		roles: ['*']
	// 	});
	// }
}());
