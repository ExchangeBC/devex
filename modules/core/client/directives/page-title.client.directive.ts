'use strict';

import angular, { IDirective, IScope } from 'angular';
import { IStateService } from 'angular-ui-router';

(() => {
	angular.module('core').directive('pageTitle', [
		'$rootScope',
		'$interpolate',
		'$state',
		($rootScope: IScope, $interpolate: ng.IInterpolateService, $state: IStateService): IDirective<IScope> => {
			return {
				restrict: 'A',
				link: (scope, element) => {
					$rootScope.$on('$stateChangeSuccess', (event, toState) => {
						const applicationCoreTitle = 'BCDevExchange';
						const separateBy = ' - ';
						if (toState.data && toState.data.pageTitle) {
							const stateTitle = $interpolate(toState.data.pageTitle)($state.$current.locals.globals);
							element.html(applicationCoreTitle + separateBy + stateTitle);
						} else {
							element.html(applicationCoreTitle);
						}
					});
				}
			};
		}
	]);
})();
