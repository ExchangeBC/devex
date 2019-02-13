'use strict';

import angular, { IController } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';

class OpportunityListController implements IController {
	public static $inject = ['AuthenticationService'];
	public isUser: boolean;

	constructor(private AuthenticationService: IAuthenticationService) {
		this.isUser = !!this.AuthenticationService.user;
	}
}

angular.module('opportunities').controller('OpportunityListController', OpportunityListController);
