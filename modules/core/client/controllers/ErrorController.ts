'use strict'

import angular, { IController } from 'angular';
import { IStateParamsService } from 'angular-ui-router';

class ErrorController implements IController {
	public static $inject = ['$stateParams'];
	public errorMessage: string;

	constructor(private $stateParams: IStateParamsService) {
		if (this.$stateParams.message) {
			this.errorMessage = this.$stateParams.message;
		}
	}
}

angular.module('core').controller('ErrorController', ErrorController);
