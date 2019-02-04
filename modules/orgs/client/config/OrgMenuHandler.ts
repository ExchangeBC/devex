'use strict';

import angular, { IRootScopeService } from 'angular';
import { IMenuService } from '../../../core/client/services/MenuService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOrgService } from '../services/OrgService';

class OrgMenuHandler {
	constructor(private $rootScope: IRootScopeService, private MenuService: IMenuService, private OrgService: IOrgService, private AuthenticationService: IAuthenticationService) {}

	public initMenus(): void {
		// Create Companies menu item
		this.MenuService.addMenuItem('topbar', {
			title: 'Companies',
			state: 'orgs.list',
			roles: ['*'],
			icon: 'none',
			position: 1
		});

		// Refresh org admin menus
		this.addOrgSubMenus();

		// Setup bindings to refresh menus on certain events
		this.setupBindings();
	}

	// Refreshes the org admin drop down menus
	private async addOrgSubMenus(): Promise<void> {
		if (this.AuthenticationService.user) {
			this.MenuService.getMenu('account').items[0].items.forEach(item => {
				if (item.state.startsWith('orgs.view')) {
					this.MenuService.removeSubMenuItem('account', item.state);
				}
			});

			const orgs = await this.OrgService.myadmin().$promise;
			if (orgs.length > 0) {
				orgs.forEach(org => {
					this.MenuService.addSubMenuItem('account', 'settings', {
						title: org.name,
						state: `orgs.view({ orgId: '${org._id}' })`
					});
				});
			}
		}
	}

	private setupBindings(): void {
		this.$rootScope.$on('orgUpdated', () => {
			this.addOrgSubMenus();
		});

		this.$rootScope.$on('userSignedIn', () => {
			this.addOrgSubMenus();
		});
	}
}

angular.module('orgs').run([
	'$rootScope',
	'MenuService',
	'OrgService',
	'AuthenticationService',
	($rootScope: IRootScopeService, MenuService: IMenuService, OrgService: IOrgService, AuthenticationService: IAuthenticationService) => {
		const handler = new OrgMenuHandler($rootScope, MenuService, OrgService, AuthenticationService);
		handler.initMenus();
	}
]);
