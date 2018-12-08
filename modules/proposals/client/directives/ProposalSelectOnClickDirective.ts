'use strict';

import angular from 'angular';

(() => {
	angular
		.module('proposals')

		// directive for selecting text inputs when focused
		.directive('selectOnClick', [
			'$window',
			$window => {
				return {
					restrict: 'A',
					link: (scope, element, attrs) => {
						element.on('click', function() {
							if (!$window.getSelection().toString()) {
								// Required for mobile Safari
								const el: any = this;
								el.setSelectionRange(0, el.value.length);
							}
						});
					}
				};
			}
		]);
})();
