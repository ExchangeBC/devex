'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IScope, uiNotification } from 'angular';
import '../../css/users.css';
import { IAdminService } from '../../services/AdminService';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserResource } from '../../services/UsersService';

export class UserController implements IController {
	public static $inject = ['$scope', '$state', 'AuthenticationService', 'userResolve', 'Notification', 'ask', 'AdminService'];

	constructor(
		private $scope: IScope,
		private $state: StateService,
		private AuthenticationService: IAuthenticationService,
		public user: IUserResource,
		private Notification: uiNotification.INotificationService,
		private ask: any,
		private AdminService: IAdminService
	) {}

	public async remove(): Promise<void> {
		const question = 'Are you sure you want to delete this user?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				await this.user.$remove();
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> User deleted'
				});
				this.$state.go('admin.users');
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async update(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
			return;
		}

		try {
			const updatedUser = await this.AdminService.update(this.user).$promise;
			this.user = updatedUser;
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Changes saved'
			});
			this.$state.go('admin.user', { userId: this.user._id });
		} catch (error) {
			this.handleError(error);
		}
	}

	public cancel(): void {
		this.$state.go('admin.user', {
			userId: this.user._id
		});
	}

	public isContextUserSelf(): boolean {
		return this.user.username === this.AuthenticationService.user.username;
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('users.admin').controller('UserController', UserController);
