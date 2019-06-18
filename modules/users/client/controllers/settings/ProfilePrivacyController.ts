'use strict';

import angular, { IController, IScope, uiNotification } from 'angular';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserService } from '../../services/UsersService';

export class ProfilePrivacyController implements IController {
	public static $inject = ['$scope', 'AuthenticationService', 'UsersService', 'Notification'];

	public user: IUser;

	constructor(private $scope: IScope, private AuthenticationService: IAuthenticationService, private UsersService: IUserService, private Notification: uiNotification.INotificationService) {
		this.user = this.AuthenticationService.user;
	}

	public async savePrivacy(isValid: boolean): Promise<void> {
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
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('users').controller('ProfilePrivacyController', ProfilePrivacyController);
