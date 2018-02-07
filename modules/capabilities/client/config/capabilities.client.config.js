(function () {
	'use strict';

	if (window.features.swu) angular.module('capabilities').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'Capabilities',
			state: 'capabilities.list',
			roles: ['*'],
			icon: 'none',
			position: 2
		});
	}]);

}());
