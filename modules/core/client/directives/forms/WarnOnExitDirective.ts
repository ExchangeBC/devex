'use strict';

import angular, { IScope } from 'angular';

(() => {
	angular.module('core').directive('warnOnExit', () => {
		interface ILinkScope extends IScope {
			parentForm?: any;
		}

		return {
			restrict: 'A',
			scope: {
				parentForm: '=name'
			},
			link($scope: ILinkScope, elem, attrs) {
				window.onbeforeunload = () => {
					if ($scope.parentForm.$dirty) {
						return 'You are about to leave the page with unsaved data. Click Cancel to remain here.';
					}
				};
				const $stateChangeStartUnbind = $scope.$on('$stateChangeStart', (event, next, current) => {
					if ($scope.parentForm.$dirty) {
						if (!confirm('You are about to leave the page with unsaved data. Click Cancel to remain here.')) {
							// Stay on current route if user cancels.
							event.preventDefault();
						}
					}
				});
				$scope.$on('destroy', () => {
					window.onbeforeunload = null;
					$stateChangeStartUnbind();
				});
			}
		};
	});
})();
