(function () {
	'use strict';
	// console.log ('window.features.swu',window.features.swu);

	if (window.features.swu) angular.module('capabilities').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Capabilities',
			state: 'capabilities.list'
		});
	}]);

}());
