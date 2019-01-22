'use strict';

import angular, { IController, ISCEService, IScope, uiNotification } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOrg } from '../../shared/IOrgDTO';
import { IOrgService } from '../services/OrgService';

interface IOrgListDirectiveScope extends IScope {
	orgs: IOrg[];
}

class OrgListDirectiveController implements IController {
	public static $inject = ['$scope', 'OrgService', 'AuthenticationService'];
	public isUser: boolean;
	public isAdmin: boolean;
	public isGov: boolean;
	public userCanAdd: boolean;
	public orgs: IOrg[];

	constructor(private $scope: IOrgListDirectiveScope, private OrgService: IOrgService, private AuthenticationService: IAuthenticationService) {
		this.isUser = !!this.AuthenticationService.user;
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.includes('admin');
		this.isGov = this.isUser && this.AuthenticationService.user.roles.includes('gov');
		// set the orgs for this scope
		this.orgs = this.$scope.orgs;
		this.init();
	}

	// Is the current user an administrator for the given org or not?
	public canUserEdit(org: IOrg): boolean {
		if (!this.isUser || this.isGov) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;

		// Users can edit if they either an admin, an org owner, or an org admin
		return this.isAdmin || org.owner._id === userId || org.admins.map(admin => admin._id).includes(userId);
	}

	// Is the current user a member of the current org
	public isUserMember(org: IOrg): boolean {
		if (!this.isUser || this.isGov || this.isAdmin) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;
		return org.members.map(member => member._id).includes(userId);
	}

	public hasPendingRequest(org: IOrg): boolean {
		if (!this.isUser || this.isGov || this.isAdmin) {
			return false;
		}

		const userId = this.AuthenticationService.user._id;
		return org.joinRequests.map(member => member._id).includes(userId);
	}

	private async init(): Promise<void> {
		if (this.isUser) {
			// get orgs that the user is an admin for
			const userOrgs = await this.OrgService.myadmin().$promise;
			const alreadyHasCompanies = this.isUser && (userOrgs && userOrgs.length > 0);
			this.userCanAdd = this.isUser && !alreadyHasCompanies && !this.isGov;
			this.$scope.$applyAsync();
		}
	}
}

angular.module('orgs').directive('orgList', () => {
	return {
		restrict: 'E',
		controllerAs: 'vm',
		scope: {
			orgs: '='
		},
		templateUrl: '/modules/orgs/client/views/list.orgs.directive.html',
		controller: OrgListDirectiveController
	};
});
