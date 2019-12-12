'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IFormController, IRootScopeService, IScope, uiNotification } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserResource, IUserService } from '../../../users/client/services/UsersService';
import { IOrgResource, IOrgService } from '../services/OrgService';

export class OrgCreateController implements IController {
	public static $inject = ['$rootScope', '$scope', '$state', 'org', 'AuthenticationService', 'Notification', 'UsersService', 'OrgService'];

	public orgForm: IFormController;
	public hasAgreed: boolean;
	public creating = false;
	public user: IUserResource;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: IScope,
		private $state: StateService,
		public org: IOrgResource,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private UsersService: IUserService,
		private OrgService: IOrgService
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
				closeOnClick: false,
				delay: null
			});

			// save the new org
			const createResponse = await this.OrgService.create(this.org).$promise;
			this.orgForm.$setPristine();
			this.AuthenticationService.user = createResponse.user;
			const newOrg = createResponse.org;

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

	// Leave the edit view
	public close(): void {
		this.$state.go('orgs.list', { orgId: this.org._id });
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('orgs').controller('OrgCreateController', OrgCreateController);
