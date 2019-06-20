'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IFormController, IRootScopeService, IScope, uiNotification } from 'angular';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserService } from '../../services/UsersService';

export class EditProfileController implements IController {
	public static $inject = ['$rootScope', '$scope', '$state', 'UsersService', 'AuthenticationService', 'Notification', 'ask'];
	public userForm: IFormController;
	public user: IUser;
	public isGov: boolean;
	public pendingGovRequest: boolean;
	public hasCompany: boolean;
	public cities: string[];
	public creatingRequest = false;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: IScope,
		private $state: StateService,
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
				message: '<i class="fas fa-check-circle"></i> Changes saved'
			});
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
				this.creatingRequest = true;
				this.user.addRequest = true;
				const updatedUser = await this.UsersService.update(this.user).$promise;
				this.pendingGovRequest = true;
				this.refreshUser(updatedUser);
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Verification request sent'
				});
			} catch (error) {
				this.handleError(error);
				this.creatingRequest = false;
			}
		}
	}

	public async delete(): Promise<void> {
		const question = "Please confirm you want to be removed from the BC Developer's Exchange";
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				await this.UsersService.removeSelf().$promise;
				this.AuthenticationService.user = null;
				// emit a signed-in event, so that the application updates the log-in status appropriately
				this.$rootScope.$broadcast('userSignedIn');
				this.$state.go('home');
				this.Notification.success({
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
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('users').controller('EditProfileController', EditProfileController);
