(function () {
	'use strict';

	angular.module('orgs').run(['menuService', 'OrgService', 'AuthenticationService', function (menuService, OrgService, AuthenticationService) {
		menuService.addMenuItem ('topbar', {
			title: 'Companies',
			state: 'orgs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});

		if (AuthenticationService.user) {
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
		}
	}]);

}());
