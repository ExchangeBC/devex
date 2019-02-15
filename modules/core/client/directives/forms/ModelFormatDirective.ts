'use strict';

import angular, { IAttributes, IAugmentedJQuery, IDirective, IDirectiveFactory, IFilterService, INgModelController, IParseService, IScope } from 'angular';
import { ModelFormatConfig } from '../../config/ModelFormatConfig';

class ModelFormatDirective implements IDirective {

	public static factory(): IDirectiveFactory {
		return ($filter: IFilterService, $parse: IParseService) => new ModelFormatDirective($filter, $parse);
	}

	public require = 'ngModel';

	constructor(private $filter: IFilterService, private $parse: IParseService) {}

	public link(scope: IScope, element: IAugmentedJQuery, attrs: IAttributes, ctrl: INgModelController): void {
		// const config = modelFormatConfig[attrs.modelFormat] || {};
		const config = ModelFormatConfig.getConfig()[attrs.modelFormat];

		const parseFuction = (funKey: string) => {
			if (attrs[funKey]) {
				const func = this.$parse(attrs[funKey]);
				return (args: IAttributes) => {
					return func(scope, args);
				};
			}
			return config[funKey];
		};

		const formatter = parseFuction('formatter');
		const parser = parseFuction('parser');
		const isEmpty = parseFuction('isEmpty');
		const keyDown = parseFuction('keyDown');
		const getModelValue = () => {
			return this.$parse(attrs.ngModel)(scope);
		};

		if (keyDown) {
			element
				.bind('blur', () => {
					element.val(
						formatter({
							$attrs: attrs,
							$eval: scope.$eval,
							$filter: this.$filter,
							$modelValue: getModelValue()
						})
					);
				})
				.bind('keydown', event => {
					keyDown({
						$attrs: attrs,
						$eval: scope.$eval,
						$event: event,
						$modelValue: getModelValue(),
						$ngModelCtrl: ctrl,
						$viewValue: element.val()
					});
				});
		}

		ctrl.$parsers.push(viewValue => {
			return parser({
				$attrs: attrs,
				$eval: scope.$eval,
				$viewValue: viewValue
			});
		});

		ctrl.$formatters.push(value => {
			return formatter({
				$attrs: attrs,
				$eval: scope.$eval,
				$filter: this.$filter,
				$modelValue: value
			});
		});

		ctrl.$isEmpty = value => {
			return isEmpty({
				$attrs: attrs,
				$eval: scope.$eval,
				$modelValue: value
			});
		};
	}
}

angular.module('core').directive('modelFormat', ['$filter', '$parse', ModelFormatDirective.factory()]);
