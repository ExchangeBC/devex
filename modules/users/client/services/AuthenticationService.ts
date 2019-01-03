'use strict';

import angular from 'angular';
import { IUser } from '../../shared/IUserDTO';

interface IGuestPermissions {
	loggedIn?: boolean;
	isLoggedIn?: boolean;
	isUser?: boolean;
	isAdmin?: boolean;
	isGov?: boolean;
}

export interface IAuthenticationService {
	user: IUser;
	permissions(): IUser | IGuestPermissions;
}

class AuthenticationService implements IAuthenticationService {
	public user: IUser;

	constructor(window: ng.IWindowService) {
		this.user = window.user;
	}

	public permissions(): IUser | IGuestPermissions {
		const isUser = !!this.user;
		const ret: IUser | IGuestPermissions = isUser ? this.user : {};
		const isAdmin = isUser && this.user.roles.indexOf('admin') !== -1;
		const isGov = isUser && this.user.roles.indexOf('gov') !== -1;
		ret.loggedIn = isUser;
		ret.isLoggedIn = isUser;
		ret.isUser = isUser;
		ret.isAdmin = isAdmin;
		ret.isGov = isGov;
		return ret;
	}
}

(() => {
	angular.module('users.services').factory('AuthenticationService', [
		'$window',
		($window: ng.IWindowService): IAuthenticationService => {
			return new AuthenticationService($window);
		}
	]);
})();
