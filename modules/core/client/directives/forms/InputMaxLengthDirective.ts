import angular, { IDirective, INgModelController, IScope } from 'angular';

(() => {
	'use strict';

	angular.module('core').directive(
		'inputMaxLength',
		(): IDirective<IScope> => {
			return {
				require: 'ngModel',
				link: (scope, element, attrs, ngModelCtrl: INgModelController) => {
					const maxlength = Number(attrs.inputMaxLength);
					function fromUser(val: any) {
						if (typeof val === 'number') {
							val = val.toString();
						}

						if (val && val.length > maxlength) {
							const transformedInput = val.substring(0, maxlength);
							ngModelCtrl.$setViewValue(transformedInput);
							ngModelCtrl.$render();
							return transformedInput;
						}
						return val;
					}
					ngModelCtrl.$parsers.push(fromUser);
				}
			};
		}
	);
})();
