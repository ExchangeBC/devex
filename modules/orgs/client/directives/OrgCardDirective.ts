'use strict';

import angular, { IController, IScope, uiNotification } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOrg } from '../../shared/IOrgDTO';
import { IOrgService } from '../services/OrgService';

interface IOrgCardDirectiveScope extends IScope {
	org: IOrg;
}

class OrgCardDirectiveController implements IController {
	public static $inject = ['$scope', 'AuthenticationService', 'ask', 'OrgService', 'Notification'];
	public org: IOrg;
	public isUser: boolean;
	public isGov: boolean;
	public isAdmin: boolean;
	public userIsMember: boolean;
	public userHasRequest: boolean;
	public userCanEdit: boolean;

	constructor(
		private $scope: IOrgCardDirectiveScope,
		private AuthenticationService: IAuthenticationService,
		private ask: any,
		private OrgService: IOrgService,
		private Notification: uiNotification.INotificationService
	) {
		this.isUser = !!this.AuthenticationService.user;
		this.isGov = this.isUser && this.AuthenticationService.user.roles.includes('gov');
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.includes('admin');
		this.refreshOrg(this.$scope.org);
	}

	public async sendJoinRequest(): Promise<void> {
		if (!this.isUser) {
			return;
		}

		// prompt user for confirmation
		const message = 'Confirm you wish to send a join request to this company';
		const choice = await this.ask.yesNo(message);
		if (choice) {
			// update the list of pending requests on the org and save the org
			try {
				this.org.joinRequests.push(this.AuthenticationService.user);
				const updatedOrg = await this.OrgService.joinRequest({ orgId: this.org._id }).$promise;

				// replace this org with the updated one
				this.refreshOrg(updatedOrg);

				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Join request sent'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private refreshOrg(newOrg: IOrg): void {
		this.org = newOrg;

		if (!this.isUser) {
			return;
		}

		const userId = this.AuthenticationService.user._id;
		this.userIsMember = this.org.members.map(member => member._id).includes(userId);
		this.userHasRequest = this.org.joinRequests.map(request => request._id).includes(userId);
		this.userCanEdit = !this.isGov && (this.isAdmin || this.org.owner._id === userId || this.org.admins.map(admin => admin._id).includes(userId));
	}

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').directive('orgCard', () => {
	return {
		restrict: 'E',
		controllerAs: 'vm',
		scope: {
			org: '='
		},
		templateUrl: '/modules/orgs/client/views/org-card-directive.html',
		controller: OrgCardDirectiveController
	};
});
