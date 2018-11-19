(() => {
	'use strict';

	angular.module('core').directive('pageTitle', pageTitle);

	pageTitle.$inject = ['$rootScope', '$interpolate', '$state'];

	function pageTitle($rootScope, $interpolate, $state) {
		const directive = {
			restrict: 'A',
			link
		};

		return directive;

		function link(scope, element) {
			$rootScope.$on('$stateChangeSuccess', listener);

			function listener(event, toState) {
				const applicationCoreTitle = 'BCDevExchange';
				const separateBy = ' - ';
				if (toState.data && toState.data.pageTitle) {
					const stateTitle = $interpolate(toState.data.pageTitle)(
						$state.$current.locals.globals
					);
					element.html(
						applicationCoreTitle + separateBy + stateTitle
					);
				} else {
					element.html(applicationCoreTitle);
				}
			}
		}
	}
})();
