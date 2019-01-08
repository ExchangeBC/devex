'use strict';

import angular, { IController, IFormController, IScope, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserService } from '../../services/UsersService';

export class EditProfileController implements IController {
	public static $inject = ['$scope', '$state', 'UsersService', 'AuthenticationService', 'Notification', 'ask'];
	public userForm: IFormController;
	public user: IUser;
	public isGov: boolean;
	public pendingGovRequest: boolean;
	public hasCompany: boolean;
	public cities: string[];

	constructor(
		private $scope: IScope,
		private $state: IStateService,
		private UsersService: IUserService,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private ask: any
	) {
		this.refreshUser(this.AuthenticationService.user);
	}

	// Update a user profile
	public async updateUserProfile(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
			return;
		}

		try {
			const updatedUser = await this.UsersService.update(this.user).$promise;
			this.$scope.$broadcast('show-errors-reset', 'vm.userForm');
			this.Notification.success({
				title: 'Success',
				message: '<i class="fas fa-check-circle"></i> Changes saved'
			});
			this.AuthenticationService.user = updatedUser;
			this.refreshUser(updatedUser);
		} catch (error) {
			this.handleError(error);
		}
	}

	public async addGovtRequest(): Promise<void> {
		const question = 'Are you sure you want to request verification as a public sector employee?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				this.user.addRequest = true;
				const updatedUser = await this.UsersService.update(this.user).$promise;
				this.pendingGovRequest = true;
				this.refreshUser(updatedUser);
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Verification request sent'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async delete(): Promise<void> {
		const question = "Please confirm you want to be removed from the BC Developer's Exchange";
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				await this.UsersService.removeSelf().$promise;
				this.$state.go('home');
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Profile deleted'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private refreshUser(newUser: IUser): void {
		this.user = newUser;
		this.isGov = this.user && this.user.roles.includes('gov');
		this.pendingGovRequest = this.user && this.user.roles.includes('gov-request');
		this.hasCompany = this.user && this.user.orgsAdmin.length > 0;
	}

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('users').controller('EditProfileController', EditProfileController);
