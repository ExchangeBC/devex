'use strict';

import angular, { IController, IFormController, IRootScopeService, IScope, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserResource, IUserService } from '../../../users/client/services/UsersService';
import { IOrgResource } from '../services/OrgService';

export class OrgCreateController implements IController {
	public static $inject = ['$rootScope', '$scope', '$state', 'org', 'AuthenticationService', 'Notification', 'UsersService'];

	public orgForm: IFormController;
	public hasAgreed: boolean;
	public creating = false;
	private user: IUserResource;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: IScope,
		private $state: IStateService,
		public org: IOrgResource,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private UsersService: IUserService
	) {
		this.user = new this.UsersService(this.AuthenticationService.user);
	}

	public async add(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.orgForm');
			return;
		}

		try {
			this.creating = true;
			this.Notification.primary({
				title: 'Please wait',
				message: 'Creating company...',
				positionX: 'center',
				positionY: 'top',
				closeOnClick: false
			});

			// save the new org
			const newOrg = await this.org.$save();
			this.orgForm.$setPristine();

			// update the user with membership, then save user
			this.user.orgsMember.push(newOrg);
			this.user.orgsAdmin.push(newOrg);
			const updatedUser = await this.UsersService.update(this.user).$promise;
			this.AuthenticationService.user = updatedUser;

			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Company saved successfully',
				replaceMessage: true
			});

			this.$rootScope.$emit('orgUpdated');

			this.$state.go('orgs.view', { orgId: newOrg._id });
		} catch (error) {
			this.handleError(error);
			this.creating = false;
			return;
		}
	}

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').controller('OrgCreateController', OrgCreateController);
