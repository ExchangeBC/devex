'use strict';

import angular, { IController, ui } from 'angular';
import { NewsletterSignupModalController } from './NewsletterSignupModalController';

class TechSummitController implements IController {
	public static $inject = ['$uibModal'];

	constructor(private $uibModal: ui.bootstrap.IModalService) {}

	public async openNewsLetterSignup(): Promise<void> {
		this.$uibModal.open({
			size: 'md',
			templateUrl: '/modules/core/client/views/newsletter.signup.modal.html',
			controllerAs: '$ctrl',
			controller: NewsletterSignupModalController
		});
	}
}

angular.module('core').controller('TechSummitController', TechSummitController);
