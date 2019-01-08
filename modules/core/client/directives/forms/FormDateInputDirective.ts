'use strict';

import angular, { IScope } from 'angular';
import FormTemplate from './FormTemplate';

(() => {
	angular
		.module('core')

		// form-date-input makes a date control (uib-date)
		.directive('formDateInput', () => {
			interface IPreCompileScope extends IScope {
				dateOptions?: any;
			}

			interface IPostCompileScope extends IScope {
				popupDate?: any;
				openPopupDate?: any;
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
					options: '='
				},
				template(elem, attrs) {
					if (attrs.hasOwnProperty('draw') && !attrs.draw) {
						return '';
					}
					return FormTemplate.date(attrs);
				},
				restrict: 'E',
				compile() {
					return {
						pre($scope: IPreCompileScope, elem, attrs) {
							$scope.dateOptions = {};
							$scope.dateOptions.showWeeks = false;
						},
						post($scope: IPostCompileScope, elem, attrs) {
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

							$scope.popupDate = {
								opened: false
							};

							$scope.openPopupDate = () => {
								$scope.popupDate.opened = true;
							};
						}
					};
				}
			};
		});
})();
