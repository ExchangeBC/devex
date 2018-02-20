(function () {
	'use strict';

	if (window.features.swu) angular.module('capabilities').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Capabilities',
			state: 'capabilities.list'
			roles: ['admin']
		});
	}]);

}());
