'use strict';

import angular, { IController, ui, uiNotification, IScope } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserService } from '../../../users/client/services/UsersService';
import { ICoreService } from '../services/CoreService';
import { NewsletterSignupModalController } from './NewsletterSignupModalController';

class TechSummitController implements IController {
	public static $inject = ['$scope', '$uibModal', 'AuthenticationService', 'CoreService', 'Notification', 'UsersService'];
	public isSubscribed: boolean;

	constructor(
		private $scope: IScope,
		private $uibModal: ui.bootstrap.IModalService,
		private AuthenticationService: IAuthenticationService,
		private CoreService: ICoreService,
		private Notification: uiNotification.INotificationService,
		private UsersService: IUserService
	) {
		this.init();
	}

	public async openNewsLetterSignup(): Promise<void> {
		if (this.AuthenticationService.user) {
			const user = this.AuthenticationService.user;
			try {
				await this.CoreService.registerEmail({ name: user.displayName, email: user.email }).$promise;
				this.Notification.success({
					message: 'Subscription complete!'
				});
			} catch (error) {
				this.Notification.error({
					message: `${error.data.message}`
				});
			}
		} else {
			const response = this.$uibModal.open({
				size: 'md',
				templateUrl: '/modules/core/client/views/newsletter.signup.modal.html',
				controllerAs: '$ctrl',
				controller: NewsletterSignupModalController
			});

			const result = await response.result;
			if (result && result.action === 'subscribed') {
				this.isSubscribed = true;
				this.$scope.$apply();
			}
		}
	}

	private async init() {
		this.isSubscribed = this.AuthenticationService.user && (await this.getSubscriptionStatus());
	}

	private async getSubscriptionStatus(): Promise<boolean> {
		const response = await this.UsersService.registrationStatus().$promise;
		if (response.subscribed) {
			return true;
		}
		return false;
	}
}

angular.module('core').controller('TechSummitController', TechSummitController);
