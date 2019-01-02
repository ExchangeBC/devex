'use strict';

import angular, { IController, IFormController, IRootScopeService, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import { IUserResource, IUserService } from '../../../users/client/services/UsersService';
import { IOrgResource, IOrgService } from '../services/OrgService';

export class OrgAdminController implements IController {
	public static $inject = ['$scope', '$state', 'org', 'OrgService', 'UsersService', 'authenticationService', 'Notification', 'ask'];
	public orgForm: IFormController;
	public tabs: any[];

	private user: IUserResource;

	constructor(private $scope: IRootScopeService, private $state: IStateService, public org: IOrgResource, private OrgService: IOrgService, private UsersService: IUserService, private authenticationService: AuthenticationService, private Notification: uiNotification.INotificationService, private ask) {
		this.$state.go('orgadmin.profile');

		this.user = new this.UsersService(this.authenticationService.user);

		this.tabs = [
			{
				name: 'Business Info',
				route: 'orgadmin.profile'
			},
			{
				name: 'Team Members',
				route: 'orgadmin.members'
			},
			{
				name: 'Terms',
				route: 'orgadmin.terms'
			}
		];
	}

	public openTab(tab: any): void {
		this.$state.go(tab.route);
	}

	public async save(isValid: true): Promise<void> {

		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.form.orgForm');
			return;
		}

		// put together the full website from the protocol and address
		this.org.website = this.org.websiteProtocol + this.org.websiteAddress;

		// save the org
		try {
			const updatedOrg = await this.OrgService.update(this.org).$promise;
			this.orgForm.$setPristine();
			this.refreshOrg(updatedOrg);
			this.Notification.success({
				title: 'Success',
				message: '<i class="fas fa-check-circle"></i> Company saved'
			});

		} catch (error) {
			this.handleError(error);
		}
	};

	public async remove(): Promise<void> {

		const question = 'Please confirm you want to delete your company.  This will invalidate any submitted proposals and team members will no longer be associated.';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				// remove the org from the current user's member/admins lists
				this.user.orgsMember = this.user.orgsMember.filter(org => org._id !== this.org._id);
				this.user.orgsAdmin = this.user.orgsAdmin.filter(org => org._id !== this.org._id);
				const updatedUser = await this.UsersService.update(this.user).$promise;
				this.authenticationService.user = updatedUser;

				// delete the org
				await this.org.$remove();

				// notify and exit
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Company deleted'
				});

				this.$state.go('orgs.list');

			} catch (error) {
				this.handleError(error);
			}

		}
	};

	private refreshOrg(newOrg: IOrgResource): void {
		this.org = newOrg;
		this.parseWebsite();
	}

	private parseWebsite() {
		const parts = this.org.website.split('://');
		if (parts[0] === 'https') {
			this.org.websiteProtocol = 'https://';
		} else {
			this.org.websiteProtocol = 'http://';
		}

		if (parts.length > 1) {
			this.org.websiteAddress = parts[1];
		} else {
			this.org.websiteAddress = this.org.website;
		}
	}

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').controller('OrgAdminController', OrgAdminController);
