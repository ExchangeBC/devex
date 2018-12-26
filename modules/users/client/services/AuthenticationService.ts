'use strict';

import angular from 'angular';
import IUserDocument from '../../server/interfaces/IUserDocument';

interface IGuestPermissions {
	loggedIn?: boolean;
	isLoggedIn?: boolean;
	isUser?: boolean;
	isAdmin?: boolean;
	isGov?: boolean;
}

export default class AuthenticationService {
	public user: IUserDocument;

	constructor(window: ng.IWindowService) {
		this.user = window.user;
	}

	public permissions(): IUserDocument | IGuestPermissions {
		const isUser = !!this.user;
		const ret: IUserDocument | IGuestPermissions = isUser ? this.user : {};
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
	angular.module('users.services').factory('authenticationService', [
		'$window',
		($window: ng.IWindowService) => {
			return new AuthenticationService($window);
		}
	]);
})();
