(function () {
	'use strict';

	angular.module('proposals').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Manage Proposals',
			state: 'proposals.list'
		});
	}]);
}());
