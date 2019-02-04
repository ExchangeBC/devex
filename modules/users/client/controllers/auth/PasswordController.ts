'use strict';

import { StateParams } from '@uirouter/core';
import { IController, ILocationService, IScope, uiNotification } from 'angular';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserResource, IUserService } from '../../services/UsersService';

interface ICredentials {
	username: string;
	password: string;
}

interface IPasswordDetails {
	token?: string;
	newPassword?: string;
	verifyPassword?: string;
}

export class PasswordController implements IController {
	public static $inject = ['$scope', '$stateParams', 'UsersService', '$location', 'AuthenticationService', 'Notification'];

	public user: IUser;
	public credentials: ICredentials;
	public passwordDetails: IPasswordDetails;

	constructor(
		private $scope: IScope,
		private $stateParams: StateParams,
		private UsersService: IUserService,
		private $location: ILocationService,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService
	) {
		this.user = this.AuthenticationService.user;
		this.credentials = {
			username: '',
			password: ''
		};
		this.passwordDetails = {};
	}

	// Submit forgotten password account id
	public async askForPasswordReset(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.forgotPasswordForm');
			return;
		}

		try {
			await this.UsersService.sendPasswordResetToken(this.credentials);
			this.onRequestPasswordResetSuccess();
		} catch (error) {
			this.onRequestPasswordResetError();
		}
	}

	public async resetUserPassword(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.resetPasswordForm');
			return;
		}

		this.passwordDetails.token = this.$stateParams.token;
		try {
			const response = await this.UsersService.resetPasswordWithToken(this.passwordDetails).$promise;
			this.onResetPasswordSuccess(response);
		} catch (error) {
			this.onResetPasswordError();
		}
	}

	private onRequestPasswordResetSuccess() {
		// Show user success message and clear form
		this.credentials = {
			username: '',
			password: ''
		};
		this.Notification.success({ message: '<i class="fas fa-check-circle"></i> Password reset email sent successfully!' });
	}

	private onRequestPasswordResetError() {
		// Show user error message and clear form
		this.credentials = {
			username: '',
			password: ''
		};

		this.Notification.error({ message: '<i class="fas fa-exclamation-triangle"></i> Failed to send password reset email!', title: 'Error', delay: 4000 });
	}

	private onResetPasswordSuccess(response: IUserResource) {
		// If successful show success message and clear form
		this.passwordDetails = {};

		// Attach user profile
		this.AuthenticationService.user = response;
		this.Notification.success({ message: '<i class="fas fa-check-circle"></i> Password reset successful!' });
		// And redirect to the index page
		this.$location.path('/password/reset/success');
	}

	private onResetPasswordError(): void {
		this.Notification.error({ message: '<i class="fas fa-exclamation-triangle"></i> Password reset failed!', title: 'Error', delay: 4000 });
	}
}
