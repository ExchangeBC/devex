'use strict';

import angular, { IAttributes, IAugmentedJQuery, IDirective, IDirectiveFactory, IFilterService, INgModelController, IScope } from 'angular';

class PercentageInputDirective implements IDirective {
	public static factory(): IDirectiveFactory {
		return ($filter: IFilterService) => new PercentageInputDirective($filter);
	}

	public restict = 'A';
	public require = 'ngModel';

	constructor(private $filter: IFilterService) {
		this.getModelValue = this.getModelValue.bind(this);
		this.getViewValue = this.getViewValue.bind(this);
	}

	public link(scope: IScope, element: IAugmentedJQuery, attrs: IAttributes, ctrl: INgModelController): void {
		ctrl.$parsers.unshift(this.getModelValue);
		ctrl.$formatters.unshift(this.getViewValue);
	}

	private getModelValue(value: string): string {
		return this.$filter('number')((parseFloat(value) / 100), 2);
	}

	private getViewValue(value: string) {
		const matchArr = value.match(/^(\d+)\/(\d+)/);
		if (matchArr) {
			return this.$filter('number')(parseInt(matchArr[1], 10) / parseInt(matchArr[2], 10), 0);
		} else {
			return this.$filter('number')(parseFloat(value) * 100, 0);
		}
	}
}

angular.module('core').directive('percentageInput', ['$filter', PercentageInputDirective.factory()]);
