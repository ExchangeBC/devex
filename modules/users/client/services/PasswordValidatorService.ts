'use strict';

import angular, { IWindowService } from 'angular';

export interface IPasswordValidatorService {
	getPopOverMsg(): string;
	getResult(password: string): boolean;
}

class PasswordValidatorService implements IPasswordValidatorService {
	public static $inject = ['$window'];

	private owaspPasswordStrengthTest: any;

	constructor($window: IWindowService) {
		this.owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;
	}

	public getPopOverMsg(): string {
		return `Please enter a passphrase or password with ${this.owaspPasswordStrengthTest.configs.minLength} or more characters, numbers, lowercase, uppercase, and special characters.`;
	}

	public getResult(password: string): boolean {
		return this.owaspPasswordStrengthTest.test(password);
	}
}

angular.module('users.services').factory('PasswordValidator', PasswordValidatorService);
