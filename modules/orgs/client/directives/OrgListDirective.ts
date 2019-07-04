'use strict';

import angular, { IController, IScope, uiNotification } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserService } from '../../../users/client/services/UsersService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOrg } from '../../shared/IOrgDTO';
import { IOrgCommonService } from '../services/OrgCommonService';
import { IOrgPagedResponse, IOrgService } from '../services/OrgService';

interface IOrgListDirectiveScope extends IScope {
	orgs: IOrgPagedResponse;
}

class OrgListDirectiveController implements IController {
	public static $inject = ['$scope', 'OrgService', 'AuthenticationService', 'ask', 'Notification', 'UsersService', 'OrgCommonService'];
	public user: IUser;
	public isUser: boolean;
	public isAdmin: boolean;
	public isGov: boolean;
	public userCanAdd: boolean;
	public orgs: IOrgPagedResponse;

	// Filtering and pagination related fields
	public searchTerm = '';
	public itemsPerPage = 8;
	public currentPage = 1;
	public filteredItems: IOrg[] = [];
	public totalFilteredItems: number;

	constructor(
		private $scope: IOrgListDirectiveScope,
		private OrgService: IOrgService,
		private AuthenticationService: IAuthenticationService,
		private ask: any,
		private Notification: uiNotification.INotificationService,
		private UsersService: IUserService,
		private OrgCommonService: IOrgCommonService
	) {
		this.user = this.AuthenticationService.user;
		this.isUser = !!this.AuthenticationService.user;
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.includes('admin');
		this.isGov = this.isUser && this.AuthenticationService.user.roles.includes('gov');
		// set the orgs for this scope
		this.filteredItems = this.$scope.orgs.data;
		this.init();
	}

	// Is the current user an administrator for the given org or not?
	public canUserEdit(org: IOrg): boolean {
		if (!this.isUser || this.isGov) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;

		// Users can edit if they either an admin, an org owner, or an org admin
		return this.isAdmin || org.owner._id === userId || org.admins.map(admin => admin._id).includes(userId);
	}

	// Is the current user a member of the current org
	public isUserMember(org: IOrg): boolean {
		if (!this.isUser || this.isGov || this.isAdmin) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;
		return org.members.map(member => member._id).includes(userId);
	}
	public userIsOrgAdmin(org: IOrg): boolean {
		return this.user && org.admins && org.admins.map(admin => admin._id).includes(this.user._id);
	}

	public hasPendingRequest(org: IOrg): boolean {
		if (!this.isUser || this.isGov || this.isAdmin) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;
		return org.joinRequests.map(member => member._id).includes(userId);
	}

	public search(): void {

		// reset the current page to 1 for simplicity
		this.currentPage = 1;

		// filter orgs by the search term
		this.filterItems();
	}

	public async filterItems(): Promise<void> {

		// retrieve a filtered and paginated list of orgs
		const response = await this.OrgService.filter({ pageNumber: this.currentPage, searchTerm: this.searchTerm, itemsPerPage: this.itemsPerPage }).$promise;

		// update the list of filtered items for the current page
		this.filteredItems = response.data;

		// update the total count of filtered items (to be used for paging)
		this.totalFilteredItems = response.totalFilteredItems;

		this.$scope.$applyAsync();
	}

	public canJoinOrg(org: IOrg): boolean {
		return this.isUser && !this.isGov && !this.isAdmin && !this.userIsOrgAdmin(org) && !this.hasPendingRequest(org) && !this.isUserMember(org);
	}

	public async sendJoinRequest(org: IOrg): Promise<void> {
		const message = `Please confirm you wish to send a join request to ${org.name}`;
		const choice = await this.ask.yesNo(message);
		if (choice) {
			// update the list of pending requests on the org and save the org
			try {
				const index = this.filteredItems.indexOf(org);
				org.joinRequests.push(this.AuthenticationService.user);
				const joinRequestResponse = await this.OrgService.joinRequest({ orgId: org._id }).$promise;
				const updatedOrg = new this.OrgService(joinRequestResponse.org);
				const updatedUser = new this.UsersService(joinRequestResponse.user);

				// replace this org with the updated one
				this.filteredItems.splice(index, 1, updatedOrg);

				// update the user
				this.AuthenticationService.user = updatedUser;
				this.user = updatedUser;

				this.Notification.success({
					message: `<i class="fas fa-check-circle"></i> Join request sent to ${org.name}`
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private async init(): Promise<void> {
		if (this.isUser) {
			// get orgs that the user is an admin for
			const userOrgs = await this.OrgService.myadmin().$promise;
			const alreadyHasCompanies = this.isUser && (userOrgs && userOrgs.length > 0);
			this.userCanAdd = this.isUser && !alreadyHasCompanies && !this.isGov;
		}

		// do initial filtering/paging
		this.filterItems();

		this.$scope.$applyAsync();
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').directive('orgList', () => {
	return {
		restrict: 'E',
		controllerAs: 'vm',
		scope: {
			orgs: '='
		},
		templateUrl: '/modules/orgs/client/views/list.orgs.directive.html',
		controller: OrgListDirectiveController
	};
});
