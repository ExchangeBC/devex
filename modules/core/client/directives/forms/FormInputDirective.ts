'use strict';

import angular, { IDirective, IScope } from 'angular';
import FormTemplate from './FormTemplate';

(() => {
	angular
		.module('core')

		.directive(
			'formInput',
			(): IDirective<IScope> => {
				interface IFormInputScope extends IScope {
					processValidator?: () => void;
					validate?: any;
					parentForm?: any;
					callValidator?: (name: string) => void;
				}

				return {
					require: 'ngModel',
					replace: true,
					transclude: true,
					scope: {
						ngModel: '=',
						draw: '=?',
						disabled: '=?',
						parentForm: '=form',
						validate: '=',
						validateOf: '=',
						onchange: '@',
						options: '='
					},
					template(elem, attrs) {
						if (attrs.hasOwnProperty('draw') && !attrs.draw) {
							return '';
						}
						return FormTemplate.input(attrs);
					},
					restrict: 'E',
					link($scope: IFormInputScope, elem, attrs, modelCtrl) {
						const options = JSON.parse(attrs.options);
						if (attrs.hasOwnProperty('disabled')) {
							$scope.$watch('disabled', newValue => {
								if (newValue) {
									angular
										.element(elem)
										.find('input')
										.attr('disabled', 'disabled');
								} else {
									angular
										.element(elem)
										.find('input')
										.removeAttr('disabled');
								}
							});
						}

						// if validation is set, run the validation to set validity of parent form
						$scope.processValidator = () => {
							$scope.validate($scope.parentForm[options.name].$viewValue).then(resp => {
								$scope.parentForm[options.name].$setValidity(options.name, resp);
								$scope.$apply();
							});
						};

						// change event handler to trigger another element's validator
						$scope.callValidator = name => {
							$scope.$parent.$broadcast('rpc.input.validator.' + name);
						};

						// event handler for other elements who wants trigger this element's validator
						if (attrs.hasOwnProperty('validateOf')) {
							$scope.$on('rpc.input.validator.' + options.name, () => {
								$scope.processValidator();
							});
						}
					}
				};
			}
		);
})();
