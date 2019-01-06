'use strict';

import angular, { IController } from 'angular';
import { IUser } from '../../../shared/IUserDTO';
import { IAuthenticationService } from '../../services/AuthenticationService';

export class SettingsController implements IController {
	public static $inject = ['AuthenticationService'];

	public user: IUser;

	constructor(private AuthenticationService: IAuthenticationService) {
		this.user = this.AuthenticationService.user;
	}
}

angular.module('users').controller('SettingsController', SettingsController);
