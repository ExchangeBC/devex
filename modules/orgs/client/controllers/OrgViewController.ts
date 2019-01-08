'use strict';

import angular, { IController, ISCEService } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOrgResource } from '../services/OrgService';

export class OrgViewController implements IController {
	public static $inject = ['org', 'AuthenticationService'];

	public user: IUser;
	public canEdit: boolean;

	constructor(public org: IOrgResource, private AuthenticationService: IAuthenticationService) {
		this.user = this.AuthenticationService.user;
		this.canEdit = this.isAdmin() || this.isOrgAdmin() || this.isOrgOwner();
	}

	private isAdmin(): boolean {
		return this.user && this.user.roles.includes('admin');
	}

	private isOrgAdmin(): boolean {
		return this.user && this.org.admins && this.org.admins.map(admin => admin._id).includes(this.user._id);
	}

	private isOrgOwner(): boolean {
		return this.user && this.org.owner && this.user._id === this.org.owner._id;
	}
}

angular.module('orgs').controller('OrgViewController', OrgViewController);
