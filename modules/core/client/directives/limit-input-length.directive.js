(function() {
	'use strict';

	angular.module('core').directive('inputMaxLength', function() {
		return {
			require: 'ngModel',
			link: function(scope, element, attrs, ngModelCtrl) {
				var maxlength = Number(attrs.inputMaxLength);
				function fromUser(val) {
					if (typeof val === 'number') {
						val = val.toString();
					}

					if (val && val.length > maxlength) {
						var transformedInput = val.substring(0, maxlength);
						ngModelCtrl.$setViewValue(transformedInput);
						ngModelCtrl.$render();
						return transformedInput;
					}
					return val;
				}
				ngModelCtrl.$parsers.push(fromUser);
			}
		};
	});
}());
