'use strict';

import angular, { IController, IFormController, IScope, ui, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserResource, IUserService } from '../../../users/client/services/UsersService';
import { IOrgResource, IOrgService } from '../services/OrgService';

export class OrgAdminController implements IController {
	public static $inject = ['$scope', '$state', 'org', 'OrgService', 'UsersService', 'AuthenticationService', 'Notification', 'ask', 'capabilities', 'dataService', 'TINYMCE_OPTIONS', '$uibModal'];
	public orgForm: IFormController;
	public cities: string[];
	public emailList = '';

	private user: IUserResource;

	constructor(
		private $scope: IScope,
		private $state: IStateService,
		public org: IOrgResource,
		private OrgService: IOrgService,
		private UsersService: IUserService,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private ask,
		public capabilities: ICapabilityResource[],
		private dataService,
		public TINYMCE_OPTIONS,
		private $uibModal: ui.bootstrap.IModalService
	) {
		this.user = new this.UsersService(this.AuthenticationService.user);
		this.cities = this.dataService.cities;
		this.refreshOrg(this.org);
	}

	public async save(isValid: true): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.form.orgForm');
			return;
		}

		// put together the full website from the protocol and address
		if (this.org.websiteAddress) {
			this.org.website = this.org.websiteProtocol + this.org.websiteAddress;
		} else {
			this.org.website = '';
		}

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
	}

	public async remove(): Promise<void> {
		const question = 'Please confirm you want to delete your company.  This will invalidate any submitted proposals and team members will no longer be associated.';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				// remove the org from the current user's member/admins lists
				this.user.orgsMember = this.user.orgsMember.filter(org => org._id !== this.org._id);
				this.user.orgsAdmin = this.user.orgsAdmin.filter(org => org._id !== this.org._id);
				const updatedUser = await this.UsersService.update(this.user).$promise;
				this.AuthenticationService.user = updatedUser;

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
	}

	public orgHasCapability(capability: ICapabilityResource): boolean {
		return this.org.capabilities.map(cap => cap.code).includes(capability.code);
	}

	// add or remove members
	public async addMembers(): Promise<void> {
		if (this.emailList !== '') {
			this.org.additions = this.emailList.toLowerCase();
			try {
				const updatedOrg = await this.OrgService.update(this.org).$promise;
				this.emailList = '';
				this.orgForm.$setPristine();
				this.refreshOrg(updatedOrg);
				this.displayInvitationCompleteDialog();
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private async displayInvitationCompleteDialog(): Promise<void> {
		if (!this.org.emaillist) {
			return;
		}

		await this.$uibModal.open({
			size: 'sm',
			templateUrl: '/modules/orgs/client/views/org-members-results.html',
			controller: [
				'$scope',
				'$uibModalInstance',
				($scope: any, $uibModalInstance: ui.bootstrap.IModalServiceInstance): void => {
					$scope.data = {
						found: this.org.emaillist.found,
						notfound: this.org.emaillist.notFound
					};

					$scope.close = (): void => {
						$uibModalInstance.close();
					};
				}
			]
		});
	}

	private refreshOrg(newOrg: IOrgResource): void {
		this.org = newOrg;
		this.parseWebsite();
	}

	private parseWebsite() {
		if (!this.org.website) {
			this.org.websiteProtocol = 'https://';
		} else {
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
