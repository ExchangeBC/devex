'use strict';

import angular from 'angular';
import FormTemplate from './FormTemplate';

(() => {
	angular
		.module('core')
		// form-display wraps whatever control you put here with label and required
		.directive('formDisplay', () => {
			return {
				require: 'ngModel',
				replace: true,
				transclude: true,
				scope: {
					options: '='
				},
				template(elem, attrs) {
					return FormTemplate.transclude(attrs);
				},
				restrict: 'E'
			};
		});
})();
