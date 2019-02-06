'use strict';

import angular, { IController } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { ICapability } from '../../shared/ICapabilityDTO';

class CapabilityViewController implements IController {
	public static $inject = ['capability', 'AuthenticationService'];

	public canEdit: boolean;
	public editingAllowed: boolean;

	constructor(private capability: ICapability, private AuthenticationService: IAuthenticationService) {
		this.canEdit = this.AuthenticationService.user && this.AuthenticationService.user.roles.includes('admin');
		this.editingAllowed = window.allowCapabilityEditing;
	}
}

angular.module('capabilities').controller('CapabilityViewController', CapabilityViewController);
