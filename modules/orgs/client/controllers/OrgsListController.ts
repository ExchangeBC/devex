'use strict';

import angular, { IController } from 'angular';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import { IOrgResource } from '../services/OrgService';

// Controller for the master list of orgs
export class OrgsListController implements IController {
	public static $inject = ['orgs', 'authenticationService'];

	public isLoggedIn: boolean;

	constructor(public orgs: IOrgResource[], private authenticationService: AuthenticationService) {
		this.isLoggedIn = !!this.authenticationService.user;
	}
}

angular.module('orgs').controller('OrgsListController', OrgsListController);
