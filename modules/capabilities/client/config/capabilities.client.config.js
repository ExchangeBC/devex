(function () {
	'use strict';

	angular.module('capabilities').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Capabilities',
			state: 'capabilities.list'
		});
	}]);

}());
