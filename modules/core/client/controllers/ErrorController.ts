'use strict'

import { StateParams } from '@uirouter/core';
import angular, { IController } from 'angular';

class ErrorController implements IController {
	public static $inject = ['$stateParams'];
	public errorMessage: string;

	constructor(private $stateParams: StateParams) {
		if (this.$stateParams.message) {
			this.errorMessage = this.$stateParams.message;
		}
	}
}

angular.module('core').controller('ErrorController', ErrorController);
