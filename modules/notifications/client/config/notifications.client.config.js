(function () {
	'use strict';

	angular.module('notifications').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Manage Notifications',
			state: 'notifications.list'
		});
	}]);

}());
