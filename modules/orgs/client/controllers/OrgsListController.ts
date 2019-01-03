'use strict';

import angular, { IController } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOrgResource } from '../services/OrgService';

// Controller for the master list of orgs
export class OrgsListController implements IController {
	public static $inject = ['orgs', 'AuthenticationService'];

	public isLoggedIn: boolean;

	constructor(public orgs: IOrgResource[], private AuthenticationService: IAuthenticationService) {
		this.isLoggedIn = !!this.AuthenticationService.user;
	}
}

angular.module('orgs').controller('OrgsListController', OrgsListController);
