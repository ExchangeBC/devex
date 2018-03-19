(function() {
	'use strict';

	angular.module('core')

	.directive('inputNumber', ['_', function(_) {
		return {
			restrict: 'A',
			require: 'ngModel',
			scope: {
				value: '=ngModel',
				precision: '=',
				unit: '='
			},
			link: function(scope, element, attr, ngModel) {
				var units = { 'na': 1, 'k': 1000, 'm': 1000000, 'b': 1000000000 };
				var unitChars = ['k', 'm', 'b'];
				var oldValue;
				var setViewFromChange;

				var precision = _.isNil(scope.precision) ? attr.precision : scope.precision;
				if (!_.isNumber(precision)) precision = 0;

				var unit = scope.unit || attr.unit || 'na';
				var unitLength = getUnitLength(unit);

				// convert number from long form to short form
				ngModel.$formatters.push(function(value) {
					var num = _.isNil(value) ? 0 : value;
					var tmp = moveDecimal(num, true, unitLength, false);
					var diff = precision - decimalLength(tmp);
					return addThousands(adjustDecimals(tmp, diff));
				});

				// convert number from short form to long form
				ngModel.$parsers.push(function(value) {
					// if view value changed from change event than ignore logic and kep the thousand separators
					if (setViewFromChange) {
						setViewFromChange = false;
						return ngModel.$modelValue;
					}

					var num = _.isNil(value) ? 0 : value;
					var last = num.substr(-1, 1);
					var hasUnit = unitChars.indexOf(last) !== -1;

					// check the difference of two decimal values' lengths
					var diff = precision - decimalLength(num) + (hasUnit ? 1 : 0);
					// if the difference is less than 0 or has extra zeros at front set the old value back to the view
					if (diff < 0 || hasExtraZeros(num) || !isValid(num)) {
						ngModel.$setViewValue(oldValue);
						ngModel.$render();
						return moveDecimal(oldValue, false, unitLength, true);
					} else {
						if (hasUnit) {
							return moveDecimal(num.substring(0, num.length - 1), false, getUnitLength(last), true);
						}
						return moveDecimal(num, false, unitLength, true);
					}
				});

				// keep the old value in the event
				element.on('keypress oncut onpaste', function(e) {
					// allow only numbers, k, m, b and .
					if ((48 <= e.charCode && e.charCode <= 57) || e.charCode === 46 || e.charCode === 98 || e.charCode === 107 || e.charCode === 109) {
						oldValue = e.target.value;
					} else {
						e.returnValue = false;
					}

				});
				element.on('focus', function(e) {
					// when the input box get focused, remove the thousand separators
					var value = e.target.value;
					value = value.replace(/,/g, '');
					ngModel.$setViewValue(value);
					ngModel.$render();

				});
				element.on('oncut onpaste', function(e) {
					oldValue = e.target.value;
				});
				// after finishing changing the number re-format and set it
				element.on('change blur', function(e) {
					if (!ngModel.$modelValue) {
						scope.value = 0;
						return;
					}
					var num = ngModel.$modelValue + '';
					var tmp = moveDecimal(num, true, unitLength, false);

					var diff = precision - decimalLength(tmp);
					var adjusted = adjustDecimals(tmp, diff);
					adjusted = addThousands(adjusted);
					setViewFromChange = true;
					ngModel.$setViewValue(adjusted);
					ngModel.$render();
				});
				//
				// EXAMPLES
				//
				// moveDecimal(12345, true, 2, false) => 123.45
				// moveDecimal(12345, true, 5, false) => 0.12345
				// moveDecimal(12345, true, 2, false) => 0.0000012345
				// moveDecimal(12345, false, 2, false) => 1234500
				// moveDecimal(12345, false, 5, false) => 1234500000
				//
				// moveDecimal(12345.6789, true, 2, false) => 123.456789
				// moveDecimal(12345.6789, true, 5, false) => 0.123456789
				// moveDecimal(12345.6789, true, 10, false) => 0.00000123456789
				// moveDecimal(12345.6789, false, 2, false) => 1234567.89
				// moveDecimal(12345.6789, false, 5, false) => 1234567890

				function moveDecimal(value, toLeft, howmany, toFloat) {
					var p = value;
					p = (p + '').split('.');
					p[1] = p[1] || '';

					var a = '',
						b = '',
						c = '',
						d = '',
						y = '',
						z = '';
					// move to left
					if (toLeft) {
						a = p[0].substring(0, p[0].length - howmany);
						b = p[0].substring(p[0].length - howmany);

						// dot is in range
						if (p[0].length > howmany) {
							c = '.';
						} else {
							// out of range, generate extra 0s
							d = '0.';
							y = Array(howmany - p[0].length + 1).join('0');
						}
						z = d + a + y + c + b + p[1];
						// move to right
					} else {
						a = p[1].substring(0, howmany);
						b = p[1].substring(howmany);

						// dot is in range
						if (p[1].length > howmany) {
							c = '.';
						} else {
							// out of range, generate extra 0s
							y = Array(howmany - p[1].length + 1).join('0');
						}
						z = p[0] + a + c + b + y;
					}
					// remove trailing dot
					if (z.endsWith('.')) z = z.substring(0, z.length - 1);

					return toFloat ? parseFloat(z) : z;
				}
				function getUnitLength(unit) {
					var unitNumber = units[unit];
					return _.isUndefined(unitNumber) ? 0 : (unitNumber + '').length - 1;
				}
				// get the length of decimal points
				function decimalLength(value) {
					var p = (value + '').split('.');
					return p.length === 2 ? p[1].length : 0;
				}
				// check if the value has invalid characters
				function isValid(value) {
					// if empty string, valid
					if (!value.length) return true;
					// if has non-numeric chateracters except for kmb at the end, invalid
					var expr = /^(\d+\.?\d*$|\d*\.?\d+[kmb]$)/g;
					var match = expr.exec(value);
					return !!match;
				}
				// check if the value has extra front zeroes
				function hasExtraZeros(value) {
					var expr = /^(0+)([0-9]+)/g;
					var match = expr.exec(value);
					return !!match;
				}

				// add thousands separators
				function addThousands(value) {
					var expr = value.indexOf('.') > 0 ? /\d{1,3}(?=(\d{3})+(?!\d)+(\.))/g : /\d{1,3}(?=(\d{3})+(?!\d))/g;
					return value.replace(expr, '$&,');
				}

				// add more decimal points of not enough
				function adjustDecimals(value, difference) {

					if (difference === 0) return value;
					var p;
					// if need more zeroes, add them at the end
					if (difference > 0) {

						p = (value + '');
						if (p.indexOf('.') === -1) p = p + '.';

						return p + Array(difference + 1).join('0');

					} else {

						// truncate any zeroes, if too many
						p = (value + '').split('.');
						p[1] = p[1].substring(0, Math.abs(precision));

						return p[0] + (p[1].length > 0 ? '.' + p[1] : '');
					}
				}
			}
		};
	}])
}());
