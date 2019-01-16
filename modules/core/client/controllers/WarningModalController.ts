'use strict';

import angular, { IController, idle, IScope } from 'angular';

class WarningModalController implements IController {
	public static $inject = ['$scope', 'Idle'];
	public countdown: number;

	constructor(private $scope: IScope, private Idle: idle.IIdleService) {
		this.countdown = this.Idle.getTimeout();

		this.$scope.$on('IdleWarn', (e, countdown) => {
			this.countdown = countdown;
			this.$scope.$apply();
		});
	}

	public getCountdownInMinutes(): number {
		return Math.floor(this.countdown / 60);
	}
}

angular.module('core').controller('WarningModalController', WarningModalController);
