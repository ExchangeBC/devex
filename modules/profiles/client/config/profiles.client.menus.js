(function () {
	'use strict';

	if (window.features.profiles) angular.module('profiles').run(['menuService', function (menuService) {
		menuService.addMenuItem ('topbar', {
			title: 'People',
			state: 'profiles.list',
			roles: ['*'],
			icon: 'fa fa-user',
			position: 1
		});
	}]);

}());
