'use strict';

import angular, { IController, IScope, uiNotification } from 'angular';
import { ICapability } from '../../../../capabilities/shared/ICapabilityDTO';
import { ICapabilitySkill } from '../../../../capabilities/shared/ICapabilitySkillDTO';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserService } from '../../services/UsersService';

export class ProfileSkillsController implements IController {
	public static $inject = ['$scope', 'Notification', 'AuthenticationService', 'UsersService', 'capabilities', 'TinyMceConfiguration'];
	public user: IUser;

	constructor(
		private $scope: IScope,
		private Notification: uiNotification.INotificationService,
		private AuthenticationService: IAuthenticationService,
		private UsersService: IUserService,
		public capabilities: ICapability[],
		private TinyMceConfiguration
	) {
		this.user = this.AuthenticationService.user;
		this.toggleSkill = this.toggleSkill.bind(this);
	}

	public async updateUserProfile(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
			return;
		}

		try {
			const updatedUser = await this.UsersService.update(this.user).$promise;
			this.user = updatedUser;
			this.AuthenticationService.user = updatedUser;
			this.$scope.$broadcast('show-errors-reset', 'vm.userForm');
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Changes saved'
			});
		} catch (error) {
			this.handleError(error);
		}
	};

	public userHasCapability(capability: ICapability): boolean {
		return this.user.capabilities.map(cap => cap.code).includes(capability.code);
	}

	public userHasSkill(skill: ICapabilitySkill): boolean {
		return this.user.capabilitySkills.map(sk => sk.code).includes(skill.code);
	}

	public toggleCapability(bool: boolean, capability: ICapability): void {
		if (bool) {
			this.user.capabilities.push(capability);
		} else {
			this.user.capabilities = this.user.capabilities.filter(cap => cap.code !== capability.code);

			// remove any claimed skills under this capability
			capability.skills.forEach(skill => this.userHasSkill(skill) && this.toggleSkill(skill));
		}
	}

	public toggleSkill(skill: ICapabilitySkill): void {
		if (!this.userHasSkill(skill)) {
			this.user.capabilitySkills.push(skill);
		} else {
			this.user.capabilitySkills = this.user.capabilitySkills.filter(sk => sk.code !== skill.code);
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

angular.module('users').controller('ProfileSkillsController', ProfileSkillsController);
