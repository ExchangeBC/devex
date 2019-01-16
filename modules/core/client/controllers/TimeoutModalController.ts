'use strict';

import angular, { IController } from 'angular';

class TimeoutModalController implements IController {
	public handleClickOK(): void {
		window.location.href = '/authentication';
	}
}

angular.module('core').controller('TimeoutModalController', TimeoutModalController);
