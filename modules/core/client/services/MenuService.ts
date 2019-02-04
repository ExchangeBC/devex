'use strict';

import angular from 'angular';
import { IUser } from '../../../users/shared/IUserDTO';

interface IMenu {
	roles: string[];
	items: IMenuItem[];
	shouldRender: (user: IUser) => boolean;
}

interface IMenuItem extends IMenu {
	title: string;
	state: string;
	type: string;
	class: string;
	position: number;
	icon: number;
}

export interface IMenuService {
	addMenu(menuId: string, options: any): IMenu;
	addMenuItem(menuId: string, options: any): IMenu;
	addSubMenuItem(menuId: string, parentItemState: string, options: any): IMenu;
	getMenu(menuId: string): IMenu;
	removeMenu(menuId: string): void;
	removeMenuItem(menuId: string, menuItemState: string): void;
	removeSubMenuItem(menuId: string, subMenuItemState: string): void;
	validateMenuExistence(menuId: string): boolean;
}

class MenuService implements IMenuService {
	private menus = new Map<string, IMenu>();
	private defaultRoles = ['user', 'admin'];
	private shouldRender: (user: IUser) => boolean;

	constructor() {
		this.init();
	}

	// Add new menu object by menu id
	public addMenu(menuId: string, options: any): IMenuItem {
		options = options || {};

		// Create the new menu
		this.menus[menuId] = {
			roles: options.roles || this.defaultRoles,
			items: options.items || [],
			shouldRender: this.shouldRender
		};

		// Return the menu object
		return this.menus[menuId];
	}

	// Add menu item object
	public addMenuItem(menuId: string, options: any) {
		options = options || {};

		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Push new menu item
		this.menus[menuId].items.push({
			title: options.title || '',
			state: options.state || '',
			type: options.type || 'item',
			class: options.class,
			roles: options.roles === null || typeof options.roles === 'undefined' ? this.defaultRoles : options.roles,
			position: options.position || 0,
			items: [],
			shouldRender: this.shouldRender,
			icon: options.icon || ''
		});

		// Add submenu items
		if (options.items) {
			for (const i in options.items) {
				if (options.items.hasOwnProperty(i)) {
					this.addSubMenuItem(menuId, options.state, options.items[i]);
				}
			}
		}

		// Return the menu object
		return this.menus[menuId];
	}

	// Add submenu item object
	public addSubMenuItem(menuId: string, parentItemState: string, options: any) {
		options = options || {};

		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item
		for (const itemIndex in this.menus[menuId].items) {
			if (this.menus[menuId].items[itemIndex].state === parentItemState) {
				// Push new submenu item
				this.menus[menuId].items[itemIndex].items.push({
					title: options.title || '',
					state: options.state || '',
					params: options.params || {},
					roles: options.roles === null || typeof options.roles === 'undefined' ? this.menus[menuId].items[itemIndex].roles : options.roles,
					position: options.position || 0,
					shouldRender: this.shouldRender
				});
			}
		}

		// Return the menu object
		return this.menus[menuId];
	}

	// Get the menu object by menu id
	public getMenu(menuId: string): IMenu {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Return the menu object
		return this.menus[menuId];
	}

	// Remove existing menu object by menu id
	public removeMenu(menuId: string): void {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		delete this.menus[menuId];
	}

	// Remove existing menu object by menu id
	public removeMenuItem(menuId: string, menuItemState: string): IMenu {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item to remove
		for (const itemIndex in this.menus[menuId].items) {
			if (this.menus[menuId].items.hasOwnProperty(itemIndex) && this.menus[menuId].items[itemIndex].state === menuItemState) {
				this.menus[menuId].items.splice(itemIndex, 1);
			}
		}

		// Return the menu object
		return this.menus[menuId];
	}

	// Remove existing menu object by menu id
	public removeSubMenuItem(menuId: string, submenuItemState: string): IMenu {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item to remove
		for (const itemIndex in this.menus[menuId].items) {
			if (this.menus[menuId].items.hasOwnProperty(itemIndex)) {
				for (const subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items.hasOwnProperty(subitemIndex) && this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}
		}

		// Return the menu object
		return this.menus[menuId];
	}

	// Validate menu existance
	public validateMenuExistence(menuId: string): boolean {
		if (menuId && menuId.length) {
			if (this.menus[menuId]) {
				return true;
			} else {
				throw new Error('Menu does not exist');
			}
		} else {
			throw new Error('MenuId was not provided');
		}
	}

	private init(): void {
		// A private function for rendering decision
		this.shouldRender = function(user) {
			if (this.roles.indexOf('*') !== -1) {
				return true;
			} else {
				if (!user) {
					return false;
				}

				for (const userRoleIndex in user.roles) {
					if (user.roles.hasOwnProperty(userRoleIndex)) {
						for (const roleIndex in this.roles) {
							if (this.roles.hasOwnProperty(roleIndex) && this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			}
		};

		// Adding the topbar menu
		this.addMenu('topbar', {
			roles: ['*']
		});
	}
}

angular.module('core').service('MenuService', MenuService);
