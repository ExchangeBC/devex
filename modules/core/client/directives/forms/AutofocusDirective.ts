'use strict';

import angular, { IDirective, IScope } from 'angular';

(() => {
	// Focus the element on page load
	// Unless the user is on a small device, because this could obscure the page with a keyboard
	angular.module('core').directive('autofocus', [
		'$timeout',
		'$window',
		($timeout, $window): IDirective<IScope> => {
			return {
				restrict: 'A',
				link(scope, element) {
					if ($window.innerWidth >= 800) {
						$timeout(() => {
							element[0].focus();
						}, 100);
					}
				}
			};
		}
	]);
})();
