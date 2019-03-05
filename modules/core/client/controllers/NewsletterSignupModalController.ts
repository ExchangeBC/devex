/* tslint:disable:no-console */
'use strict';

import { IScope, ui, uiNotification } from 'angular';
import { ICoreService } from '../services/CoreService';

export class NewsletterSignupModalController {
	public static $inject = ['$scope', 'CoreService', 'Notification', '$uibModalInstance'];
	public allowSave = false;
	public email = '';
	public name = '';
	public siteID: string;

	constructor(private $scope: IScope, private CoreService: ICoreService, private Notification: uiNotification.INotificationService, private $uibModalInstance: ui.bootstrap.IModalServiceInstance) {
		window.enableSave = this.enableSave;
		this.saveEmail = this.saveEmail.bind(this);
		this.siteID = window.recaptchaSiteId;
	}

	public enableSave = async (token: string) => {
		// Verify response token with server
		if (token) {
			const response = await this.CoreService.verifyRecaptcha({ token }).$promise;
			if (response && response.message === 'valid') {
				this.allowSave = true;
				this.$scope.$apply();
			}
		}
	};

	public async saveEmail(): Promise<void> {
		if (this.name && this.email) {
			try {
				await this.CoreService.registerEmail({ name: this.name, email: this.email }).$promise;
				this.Notification.success({
					message: 'Subscription complete!'
				});
				this.$uibModalInstance.close({
					action: 'subscribed'
				});
			} catch (error) {
				this.Notification.error({
					message: `${error.data.message}`
				});
			}
		}
	}

	public quitnow(): void {
		this.$uibModalInstance.dismiss('cancel');
	}
}
