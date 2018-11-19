// Import TinyMCE 4 here so that webpack picks it up - unfortunately,
// it has to be imported in pieces due to the way the module is bundled
import angular, { INgModelController } from 'angular';
import 'tinymce';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/textcolor';
import 'tinymce/plugins/wordcount';
import 'tinymce/themes/modern/theme';
import 'tinymce/tinymce';

require.context(
	'file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins',
	true,
	/.*/
);

(() => {
	'use strict';

	const global: any = {};
	global.keyHelper = {
		smallKeyBoard(event) {
			const which = event.which;
			return which >= 96 && which <= 105;
		},
		numberKeyBpoard(event) {
			const which = event.which;
			return which >= 48 && which <= 57 && !event.shiftKey;
		},
		functionKeyBoard(event) {
			const which = event.which;
			return (
				which <= 40 ||
				(navigator.platform.indexOf('Mac') > -1 && event.metaKey) ||
				(navigator.platform.indexOf('Win') > -1 && event.ctrlKey)
			);
		},
		currencyKeyBoard(event, viewValue) {
			const which = event.which;
			return (
				viewValue.toString().indexOf('$') === -1 &&
				which === 52 &&
				event.shiftKey
			);
		},
		floatKeyBoard(event, viewValue) {
			const which = event.which;
			return (
				[188].indexOf(which) !== -1 ||
				((which === 190 || which === 110) &&
					viewValue.toString().indexOf('.') === -1)
			);
		}
	};

	angular
		.module('core')
		.constant('_', window._)
		.constant('TINYMCE_OPTIONS', {
			elementpath: false,
			height: 100,
			menubar: '',
			plugins: 'textcolor lists advlist link wordcount',
			resize: true,
			statusbar: true,
			toolbar:
				'undo redo | styleselect | bold italic underline strikethrough \
				| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent \
				| link | forecolor backcolor',
			width: '100%' // I *think* its a number and not '400' string
		})
		.constant('modelFormatConfig', {
			currency: {
				formatter(args) {
					const modelValue = args.$modelValue;
					const filter = args.$filter;
					const attrs = args.$attrs;
					const $eval = args.$eval;
					const val = filter('currency')(modelValue);
					return attrs.prefixed && $eval(attrs.prefixed)
						? val
						: val
						? val.substr(1)
						: '';
				},
				parser(args) {
					const viewValue = args.$viewValue;
					const num = viewValue
						? viewValue.replace(/[^0-9.]/g, '')
						: ''; // replace not a function - viewvalue undefined
					const result = parseFloat(num);
					return isNaN(result)
						? undefined
						: parseFloat(result.toFixed(2));
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;
					const viewValue = args.$viewValue;

					if (
						!(
							global.keyHelper.smallKeyBoard(event) ||
							global.keyHelper.numberKeyBpoard(event) ||
							global.keyHelper.functionKeyBoard(event) ||
							global.keyHelper.currencyKeyBoard(
								event,
								viewValue
							) ||
							global.keyHelper.floatKeyBoard(event, viewValue)
						)
					) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			},
			digit: {
				formatter(args) {
					return args.$modelValue;
				},
				parser(args) {
					return args.$viewValue
						? args.$viewValue.replace(/[^0-9]/g, '')
						: undefined;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;

					if (
						!(
							global.keyHelper.smallKeyBoard(event) ||
							global.keyHelper.numberKeyBpoard(event) ||
							global.keyHelper.functionKeyBoard(event)
						)
					) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			},
			int: {
				formatter(args) {
					const modelValue = args.$modelValue;
					const filter = args.$filter;
					return filter('number')(modelValue);
				},
				parser(args) {
					const val = parseInt(
						args.$viewValue.replace(/[^0-9]/g, ''),
						10
					);
					return isNaN(val) ? undefined : val;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;

					if (
						!(
							global.keyHelper.smallKeyBoard(event) ||
							global.keyHelper.numberKeyBpoard(event) ||
							global.keyHelper.functionKeyBoard(event)
						)
					) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			},
			float: {
				formatter(args) {
					const modelValue = args.$modelValue;
					const filter = args.$filter;
					return filter('number')(modelValue);
				},
				parser(args) {
					const val = parseFloat(
						args.$viewValue.replace(/[^0-9.]/g, '')
					);
					const ENOB = 3;
					const tempNum = Math.pow(10, ENOB);
					return isNaN(val)
						? undefined
						: Math.round(val * tempNum) / tempNum;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;
					const viewValue = args.$viewValue;

					if (
						!(
							global.keyHelper.smallKeyBoard(event) ||
							global.keyHelper.numberKeyBpoard(event) ||
							global.keyHelper.functionKeyBoard(event) ||
							global.keyHelper.floatKeyBoard(event, viewValue)
						)
					) {
						event.stopPropagation();
						event.preventDefault();
					}
				}
			},
			boolean: {
				formatter(args) {
					const modelValue = args.$modelValue;
					if (!angular.isUndefined(modelValue)) {
						return modelValue.toString();
					}
				},
				parser(args) {
					const viewValue = args.$viewValue;
					if (!angular.isUndefined(viewValue)) {
						return viewValue.trim() === 'true';
					}
				},
				isEmpty(value) {
					return angular.isUndefined(value);
				}
			}
		})
		.directive('modelFormat', [
			'modelFormatConfig',
			'$filter',
			'$parse',
			(modelFormatConfig, $filter, $parse) => {
				return {
					require: 'ngModel',
					link(scope, element, attrs, ctrl: INgModelController) {
						const config =
							modelFormatConfig[attrs.modelFormat] || {};

						const parseFuction = funKey => {
							if (attrs[funKey]) {
								const func = $parse(attrs[funKey]);
								return args => {
									return func(scope, args);
								};
							}
							return config[funKey];
						};

						const formatter = parseFuction('formatter');
						const parser = parseFuction('parser');
						const isEmpty = parseFuction('isEmpty');
						const keyDown = parseFuction('keyDown');
						const getModelValue = () => {
							return $parse(attrs.ngModel)(scope);
						};

						if (keyDown) {
							element
								.bind('blur', () => {
									element.val(
										formatter({
											$attrs: attrs,
											$eval: scope.$eval,
											$filter,
											$modelValue: getModelValue()
										})
									);
								})
								.bind('keydown', event => {
									keyDown({
										$attrs: attrs,
										$eval: scope.$eval,
										$event: event,
										$modelValue: getModelValue(),
										$ngModelCtrl: ctrl,
										$viewValue: element.val()
									});
								});
						}

						ctrl.$parsers.push(viewValue => {
							return parser({
								$attrs: attrs,
								$eval: scope.$eval,
								$viewValue: viewValue
							});
						});

						ctrl.$formatters.push(value => {
							return formatter({
								$attrs: attrs,
								$eval: scope.$eval,
								$filter,
								$modelValue: value
							});
						});

						ctrl.$isEmpty = value => {
							return isEmpty({
								$attrs: attrs,
								$eval: scope.$eval,
								$modelValue: value
							});
						};
					}
				};
			}
		])
		.directive('checkBoxToArray', [
			() => {
				return {
					restrict: 'A',
					require: 'ngModel',
					link(scope, element, attrs, ctrl: INgModelController) {
						const value = scope.$eval(attrs.checkBoxToArray);
						ctrl.$parsers.push(viewValue => {
							const modelValue = ctrl.$modelValue
								? angular.copy(ctrl.$modelValue)
								: [];
							if (
								viewValue === true &&
								modelValue.indexOf(value) === -1
							) {
								modelValue.push(value);
							}

							if (
								viewValue !== true &&
								modelValue.indexOf(value) !== -1
							) {
								modelValue.splice(modelValue.indexOf(value), 1);
							}

							return modelValue.sort();
						});

						ctrl.$formatters.push(modelValue => {
							return (
								modelValue && modelValue.indexOf(value) !== -1
							);
						});

						ctrl.$isEmpty = $modelValue => {
							return !$modelValue || $modelValue.length === 0;
						};
					}
				};
			}
		]);
})();
