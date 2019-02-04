'use strict';

import angular from 'angular';
import { IMenuService } from '../services/MenuService';

class CoreMenuHandler {
	constructor(private MenuService: IMenuService) {}

	public initMenus(): void {
		this.MenuService.addMenu('account', {
			roles: ['user']
		});

		this.MenuService.addMenuItem('account', {
			title: '',
			state: 'settings',
			type: 'dropdown',
			roles: ['user']
		});

		this.MenuService.addSubMenuItem('account', 'settings', {
			title: 'Settings',
			state: 'settings.profile'
		});
	}
}

angular.module('core').run([
	'MenuService',
	(MenuService: IMenuService) => {
		const handler = new CoreMenuHandler(MenuService);
		handler.initMenus();
	}
]);
