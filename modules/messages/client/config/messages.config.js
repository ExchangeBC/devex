(function () {
	'use strict';
	angular.module ('messages').run (['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Message Templates',
			state: 'messagetemplates.list'
		});
	}]);

}());
