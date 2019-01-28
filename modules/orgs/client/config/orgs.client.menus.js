(function () {
	'use strict';

	angular.module('orgs').run(['menuService', 'OrgService', function (menuService, OrgService) {
		menuService.addMenuItem ('topbar', {
			title: 'Companies',
			state: 'orgs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});

		OrgService.myadmin().$promise.then(orgs => {
			if (orgs.length > 0) {
				orgs.forEach(org => {
					menuService.addSubMenuItem('account', 'settings', {
						title: org.name,
						state: `orgs.view({ orgId: '${org._id}' })`
					})
				})
			}
		});
	}]);

}());
