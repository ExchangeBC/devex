'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IRootScopeService, IScope, ui, uiNotification } from 'angular';
import _ from 'lodash';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapability } from '../../../capabilities/shared/ICapabilityDTO';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOrgCommonService } from '../services/OrgCommonService';
import { IOrgResource, IOrgService } from '../services/OrgService';

export class OrgViewController implements IController {
	public static $inject = ['$rootScope', '$scope', 'org', 'AuthenticationService', 'capabilities', 'OrgService', 'Notification', '$uibModal', 'ask', '$state', 'OrgCommonService'];

	public user: IUser;
	public canEdit: boolean;
	public org: IOrgResource;
	public orgCapabilities: ICapability[];
	public orgSkills: ICapabilitySkill[];
	public orgIsCapable: boolean;
	public orgHasMetRFQ: boolean;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: IScope,
		org: IOrgResource,
		private AuthenticationService: IAuthenticationService,
		public capabilities: ICapabilityResource[],
		private OrgService: IOrgService,
		private Notification: uiNotification.INotificationService,
		private $uibModal: ui.bootstrap.IModalService,
		private ask: any,
		private $state: StateService,
		private OrgCommonService: IOrgCommonService
	) {
		this.refreshOrg(org);
		this.user = this.AuthenticationService.user;
		this.canEdit = this.isAdmin() || this.isOrgAdmin() || this.isOrgOwner();
	}

	public isOrgMember(): boolean {
		return this.isOrgAdmin() || this.isOrgOwner() || this.org.members.map(member => member._id).includes(this.user._id);
	}

	public isGov(): boolean {
		return this.user && this.user.roles.includes('gov');
	}

	public isAdmin(): boolean {
		return this.user && this.user.roles.includes('admin');
	}

	public isOrgAdmin(): boolean {
		return this.user && this.org.admins && this.org.admins.map(admin => admin._id).includes(this.user._id);
	}

	public isOrgOwner(): boolean {
		return this.user && this.org.owner && this.user._id === this.org.owner._id;
	}

	public orgHasCapability(capability: ICapability): boolean {
		const hasCap = this.orgCapabilities && this.orgCapabilities.map(cap => cap.code).includes(capability.code);
		return hasCap;
	}

	// Accepts a join request by adding the requesting member to the team and saving the org
	public async acceptMember(member: IUser): Promise<void> {
		const question = `Confirm addition of ${member.displayName} to ${this.org.name}`;
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				const joinRequestResponse = await this.OrgService.acceptRequest({ orgId: this.org._id, userId: member._id }).$promise;
				const updatedOrg = new this.OrgService(joinRequestResponse.org);
				this.refreshOrg(updatedOrg);
				this.Notification.success({
					message: `<i class="fas fa-check-circle"></i> ${member.displayName} is now a member of ${this.org.name}`
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// Declines a join requests by deleting the request and saving the org
	public async declineMember(member: IUser): Promise<void> {
		const question = `Confirm request declination for ${member.displayName}`;
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				const joinRequestResponse = await this.OrgService.declineRequest({ orgId: this.org._id, userId: member._id }).$promise;
				const updatedOrg = new this.OrgService(joinRequestResponse.org);
				this.refreshOrg(updatedOrg);
				this.Notification.success({
					message: `<i class="fas fa-check-circle"></i> Request declined`
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async acceptTerms(): Promise<void> {
		try {
			this.org.isAcceptedTerms = true;
			this.org.acceptedTermsDate = new Date();
			const updatedOrg = await this.OrgService.update(this.org).$promise;
			this.refreshOrg(updatedOrg);
			this.Notification.success({
				message: `<i class="fas fa-check-circle"></i> Terms accepted`
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	// Open a modal to view team member details (also used for requesting users)
	public async viewMemberDetails(member: IUser, isRequest: boolean): Promise<void> {
		if (!this.isOrgAdmin && !this.isOrgOwner && !this.isAdmin) {
			return;
		}

		this.$uibModal.open({
			size: 'md',
			templateUrl: '/modules/orgs/client/views/org-member-detail.html',
			controllerAs: 'vm',
			resolve: {
				member: () => angular.copy(member),
				isRequest: () => isRequest,
				parent: () => this
			},
			controller: [
				'$uibModalInstance',
				'member',
				'isRequest',
				'parent',
				function($uibModalInstance: ui.bootstrap.IModalInstanceService, member: IUser, isRequest: boolean, parent: OrgViewController) {
					const vm = this;
					vm.member = member;
					vm.isRequest = isRequest;
					vm.parent = parent;

					vm.close = (): void => {
						$uibModalInstance.close({});
					};

					vm.removeMember = async (): Promise<void> => {
						await vm.parent.removeMember(vm.member);
						$uibModalInstance.close({});
					};
				}
			]
		});
	}

	// Open a modal for editing the org name and/or logo image
	public async editOrgInfo(): Promise<void> {
		if (!this.isOrgAdmin && !this.isOrgOwner && !this.isAdmin) {
			return;
		}

		const modalInstance = this.$uibModal.open({
			size: 'md',
			templateUrl: '/modules/orgs/client/views/org-edit-name.html',
			controllerAs: 'vm',
			resolve: {
				org: () => angular.copy(this.org)
			},
			controller: [
				'$uibModalInstance',
				'org',
				'OrgService',
				function($uibModalInstance: ui.bootstrap.IModalServiceInstance, org: IOrgResource, OrgService: IOrgService) {
					const vm = this;
					vm.org = org;

					vm.save = async (): Promise<void> => {
						// put together the full website from the protocol and address
						if (vm.org.websiteAddress) {
							vm.org.website = vm.org.websiteProtocol + vm.org.websiteAddress;
						} else {
							vm.org.website = '';
						}

						const updatedOrg = await OrgService.update(org).$promise;
						$uibModalInstance.close({
							updatedOrg
						});
					};

					vm.close = (): void => {
						$uibModalInstance.close({});
					};
				}
			]
		});

		// If the reponse includes an updated org, refresh the parent view
		const returnedData = await modalInstance.result;
		if (returnedData.updatedOrg) {
			this.refreshOrg(returnedData.updatedOrg);
		}
	}

	public async editOrgContact(): Promise<void> {
		if (!this.isOrgAdmin && !this.isOrgOwner && !this.isAdmin) {
			return;
		}

		const modalInstance = this.$uibModal.open({
			size: 'md',
			templateUrl: '/modules/orgs/client/views/org-edit-contact.html',
			controllerAs: 'vm',
			resolve: {
				org: () => angular.copy(this.org),
				parent: () => this
			},
			controller: [
				'$uibModalInstance',
				'org',
				'OrgService',
				function($uibModalInstance: ui.bootstrap.IModalServiceInstance, org: IOrgResource, OrgService: IOrgService) {
					const vm = this;
					vm.org = org;

					vm.save = async (): Promise<void> => {
						const updatedOrg = await OrgService.update(org).$promise;
						$uibModalInstance.close({
							updatedOrg
						});
					};

					vm.close = (): void => {
						$uibModalInstance.close({});
					};
				}
			]
		});

		// If the reponse includes an updated org, refresh the parent view
		const returnedData = await modalInstance.result;
		if (returnedData.updatedOrg) {
			this.refreshOrg(returnedData.updatedOrg);
		}
	}

	public async removeMember(member: IUser): Promise<void> {
		const question = `Please confirm you want to remove ${member.displayName} from the company`;
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				const updatedOrg = await this.OrgService.removeUser({ orgId: this.org._id, userId: member._id }).$promise;
				this.refreshOrg(updatedOrg);
				this.Notification.success({
					message: `<i class="fas fa-check-circle"></i> ${member.displayName} has been removed`
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async removeOrg(): Promise<void> {
		const question = 'Please confirm you want to delete your company.  This will invalidate any submitted proposals and team members will no longer be associated.';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				// delete the org
				await this.org.$remove();

				// emit event
				this.$rootScope.$emit('orgUpdated');

				// notify and exit
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Company deleted'
				});

				this.$state.go('orgs.list');
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private async refreshOrg(newOrg: IOrgResource): Promise<void> {
		this.org = newOrg;
		this.orgIsCapable = await this.OrgCommonService.isOrgCapable(this.org);
		this.orgHasMetRFQ = await this.OrgCommonService.hasOrgMetRFQ(this.org);
		this.$rootScope.$emit('orgUpdated');
		this.refreshOrgCapabilities();
		this.parseWebsite();
	}

	private refreshOrgCapabilities(): void {
		const memberCaps = this.org.members ? _.flatten(this.org.members.map(member => member.capabilities)) : [];
		this.orgCapabilities = _.uniqWith(memberCaps, (cap1, cap2) => cap1.code === cap2.code);

		const memberSkills = this.org.members ? _.flatten(this.org.members.map(member => member.capabilitySkills)) : [];
		this.orgSkills = _.uniqWith(memberSkills, (sk1, sk2) => sk1.code === sk2.code);

		this.$scope.$applyAsync();
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
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').controller('OrgViewController', OrgViewController);
