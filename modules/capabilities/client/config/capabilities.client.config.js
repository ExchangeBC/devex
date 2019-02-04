(function () {
	'use strict';

	angular.module('capabilities').run(['MenuService', function (MenuService) {
		MenuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Manage Capabilities',
			state: 'capabilities.list'
		});
	}]);

}());
