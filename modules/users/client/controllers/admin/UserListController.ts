'use strict';

import angular, { IController, IScope } from 'angular';
import { IAdminService } from '../../services/AdminService';
import { IUserResource } from '../../services/UsersService';

export class UserListController implements IController {
	public static $inject = ['$scope', 'AdminService'];

	public users: IUserResource[];
	public filteredItems: IUserResource[];
	public pagedItems: IUserResource[];
	public itemsPerPage = 15;
	public currentPage = 1;
	public searchTerm = '';

	constructor(private $scope: IScope, private AdminService: IAdminService) {
		this.refreshUsers();
	}

	private async refreshUsers(): Promise<void> {
		this.users = await this.AdminService.query().$promise;
		this.buildPager();
	}

	private async buildPager(): Promise<void> {
		this.pagedItems = [];
		this.figureOutItemsToDisplay();
		this.$scope.$apply();
	}

	private async figureOutItemsToDisplay(): Promise<void> {
		const searchText = this.searchTerm.toLowerCase();
		this.filteredItems = this.users.filter(user => user.displayName.toLowerCase().includes(searchText) || user.username.includes(searchText) || user.email.includes(searchText));

		const begin = (this.currentPage - 1) * this.itemsPerPage;
		const end = begin + this.itemsPerPage;
		this.pagedItems = this.filteredItems.slice(begin, end);
	}
}

angular.module('users.admin').controller('UserListController', UserListController);
