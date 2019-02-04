'use strict';

import angular from 'angular';
import { IMenuService } from '../services/MenuService';

class CoreAdminMenuHandler {
	constructor(private MenuService: IMenuService) {}

	public initMenus(): void {
		this.MenuService.addMenuItem('topbar', {
			title: 'Admin',
			state: 'admin',
			type: 'dropdown',
			roles: ['admin'],
			icon: 'fas fa-cog'
		});
	}
}

angular.module('core').run([
	'MenuService',
	(MenuService: IMenuService) => {
		const handler = new CoreAdminMenuHandler(MenuService);
		handler.initMenus();
	}
]);
