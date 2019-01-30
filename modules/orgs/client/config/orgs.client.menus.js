(function () {
	'use strict';

	angular.module('orgs').run(['$rootScope', 'menuService', 'OrgService', 'AuthenticationService', function ($rootScope, menuService, OrgService, AuthenticationService) {
		menuService.addMenuItem ('topbar', {
			title: 'Companies',
			state: 'orgs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});

		function addOrgSubMenus() {
			if (AuthenticationService.user) {

				menuService.getMenu('account').items[0].items.forEach(item => {
					if (item.state.startsWith('orgs.view')) {
						menuService.removeSubMenuItem('account', item.state);
					}
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
			}
		}
		addOrgSubMenus();

		$rootScope.$on('orgUpdated', () => {
			addOrgSubMenus();
		});

		$rootScope.$on('userSignedIn', () => {
			addOrgSubMenus();
		});
	}]);

}());
