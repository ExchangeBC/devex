'use strict';

import angular, { IController, IScope } from 'angular';

interface AvatarDisplayDirectiveScope extends IScope {
	url: string;
	size: number;
	text: string;
	type: string;
}

class AvatarDisplayDirectiveController implements IController {
	public static $inject = ['$scope'];
	public size: number;
	public text: string;
	public type: string;
	public fullUrl: string;

	constructor(private $scope: AvatarDisplayDirectiveScope) {
		this.size = this.$scope.size || 50;
		this.text = this.$scope.text || '';
		this.type = this.$scope.type || 'rounded-circle';
		this.setUrl();

		this.$scope.$watch('url', (newValue: string) => {
			if (newValue) {
				this.setUrl();
			}
		});
	}

	private setUrl(): void {
		const url = this.$scope.url;
		if (!url) {
			this.fullUrl = '';
		} else {
			this.fullUrl = (url.substr(0, 1) === '/' || url.substr(0, 4) === 'http' ? '' : '/') + url;
		}
	}
}

angular.module('core').directive('avatarDisplay', () => {
	return {
		replace: true,
		scope: {
			url: '=',
			size: '=',
			text: '=',
			type: '='
		},
		template:
			'<span>' +
			'<img class="{{ $ctrl.type }}" width="{{ $ctrl.size }} ' +
			'height="{{ $ctrl.size }}" src="{{ $ctrl.fullUrl }}"> &nbsp; {{ $ctrl.text }}' +
			'</img>' +
			'</span>',
		restrict: 'EAC',
		controllerAs: '$ctrl',
		controller: AvatarDisplayDirectiveController
	}
});
