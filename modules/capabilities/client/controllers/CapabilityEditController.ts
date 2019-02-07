'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IFormController, IRootScopeService, uiNotification } from 'angular';
import { Settings } from 'tinymce';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { ICapabilitySkill } from '../../shared/ICapabilitySkillDTO';
import { ICapabilitiesService, ICapabilityResource } from '../services/CapabilitiesService';
import { ICapabilitySkillResource, ICapabilitySkillsService } from '../services/CapabilitiesSkillsService';

class CapabilityEditController implements IController {
	public static $inject = ['$scope', '$state', 'capability', 'Notification', 'TinyMceConfiguration', 'CapabilitiesService', 'CapabilitySkillsService', 'ask'];

	public newskill: string;
	public editingskill: ICapabilitySkill;
	public capabilityForm: IFormController;

	constructor(
		private $scope: IRootScopeService,
		private $state: StateService,
		public capability: ICapabilityResource,
		private Notification: uiNotification.INotificationService,
		public TinyMceConfiguration: Settings,
		private CapabilitiesService: ICapabilitiesService,
		private CapabilitySkillsService: ICapabilitySkillsService,
		private ask: any
	) {
		this.newskill = '';
	}

	// check for duplicate skills
	public isDuplicateSkill = (newSkillName: string, existingSkills: ICapabilitySkill[]): boolean => {
		let found = false;
		let i = 0;
		while (!found && i < existingSkills.length) {
			found = existingSkills[i++].name.toLowerCase() === newSkillName.toLowerCase();
		}
		return found;
	};

	// save the capability, could be added or edited (post or put)
	public savenow = async (isValid: boolean): Promise<void> => {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'qqq.capabilityForm');
			return;
		}

		try {
			let newCapability: ICapabilityResource;
			if (this.capability._id) {
				newCapability = await this.CapabilitiesService.update(this.capability).$promise;
			} else {
				newCapability = await this.CapabilitiesService.create(this.capability).$promise;
			}
			this.capabilityForm.$setPristine();
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Capability saved'
			});
			this.capability = newCapability;
			return;
		} catch (error) {
			this.Notification.error({
				message: "<i class='fas fa-exclamation-triangle'></i> Save failed: " + error
			});
			return;
		}
	};

	// add a new capability skill
	public addSkill = async (): Promise<void> => {
		// leave if no string
		if (!this.newskill) {
			this.Notification.error({
				message: 'No Skill was supplied',
				title: "<i class='fas fa-exclamation-triangle'></i> Missing Skill"
			});
			this.newskill = '';
			return;
		}

		// check that this is not a duplicate within the current set
		this.capability.skills = this.capability.skills ? this.capability.skills : [];
		if (this.isDuplicateSkill(this.newskill, this.capability.skills)) {
			this.Notification.error({
				message: 'Duplicate Skill',
				title: "<i class='fas fa-exclamation-triangle'></i> Duplicate Skill"
			});
			this.newskill = '';
			return;
		}

		const capabilitySkill: any = {
			name: this.newskill
		};

		try {
			const newSkill = await this.CapabilitySkillsService.create(capabilitySkill).$promise;
			this.capability.skills.push(newSkill);
			this.savenow(true);
			this.newskill = '';
			this.capabilityForm.$setPristine();
			return;
		} catch (error) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> Error Saving Skill"
			});
			return;
		}
	};

	// enter edit mode for a skill
	public editSkill = (capabilitySkill: ICapabilitySkillResource): void => {
		this.newskill = capabilitySkill.name;
		this.editingskill = capabilitySkill;
	};

	// update a skill
	public updateSkill = async (): Promise<void> => {
		// leave if no string
		if (!this.newskill) {
			this.Notification.error({
				message: 'No Skill was supplied',
				title: "<i class='fas fa-exclamation-triangle'></i> Missing Skill"
			});
			this.newskill = '';
			return;
		}

		// check that this is not a duplicate within the current set
		if (!this.editingskill) {
			if (this.isDuplicateSkill(this.newskill, this.capability.skills)) {
				this.Notification.error({
					title: "<i class='fas fa-exclamation-triangle'></i> Duplicate Skill"
				});
				this.newskill = '';
				return;
			}
		}

		this.editingskill.name = this.newskill;

		try {
			await this.CapabilitySkillsService.update(this.editingskill as ICapabilitySkillResource).$promise;
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Skill updated'
			});
			this.newskill = '';
			this.editingskill = null;
			this.capabilityForm.$setPristine();
			return;
		} catch (error) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> Error Updating Skill"
			});
			return;
		}
	};

	// delete a skill - confirm first
	public deleteSkill = async (capabilitySkill: ICapabilitySkillResource): Promise<void> => {
		const question = 'Confirm you want to delete this skill.  This cannot be undone.';
		const response = await this.ask.yesNo(question);
		if (response) {
			try {
				await this.CapabilitySkillsService.remove({ capabilityskillId: capabilitySkill._id }).$promise;
				this.capability.skills = this.capability.skills.reduce((accum, current) => {
					if (current.code !== capabilitySkill.code) {
						accum.push(current);
					}
					return accum;
				}, []);
				this.savenow(true);
				return;
			} catch (error) {
				this.Notification.error({
					title: 'Error',
					message: "<i class='fas fa-exclamation-triangle'></i> Error Removing Skill"
				});
				return;
			}
		}
	};

	// remove the capability with some confirmation
	public remove = async (): Promise<void> => {
		const question = 'Confirm you want to delete this capability.  This cannot be undone.';
		const response = await this.ask.yesNo(question);
		if (response) {
			try {
				this.capability.skills.forEach(
					async (capabilitySkill: ICapabilitySkillResource): Promise<void> => {
						await this.CapabilitySkillsService.remove({ capabilityskillId: capabilitySkill._id }).$promise;
					}
				);

				await this.CapabilitiesService.remove({ capabilityId: this.capability._id }).$promise;
				this.$state.go('capabilities.list');
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Capability deleted'
				});
				return;
			} catch (error) {
				this.Notification.error({
					title: 'Error',
					message: "<i class='fas fa-exclamation-triangle'></i> Error Removing Capability"
				});
				return;
			}
		}
	};

	// close the edit view and return to the capability list or capability view
	public close = (): void => {
		if (this.capability._id) {
			this.$state.go('capabilities.view', { capabilityId: this.capability._id });
		} else {
			this.$state.go('capabilities.list');
		}
	};
}

angular.module('capabilities').controller('CapabilityEditController', CapabilityEditController);
