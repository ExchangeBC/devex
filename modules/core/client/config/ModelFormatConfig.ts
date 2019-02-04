'use strict';

import angular, { IAttributes } from 'angular';

interface IFormatConfig {
	formatter(args: IAttributes): string;
	parser(args: IAttributes): number | boolean | string;
	isEmpty(value: IAttributes): boolean;
	keyDown?(args: IAttributes): void;
}

interface IModelFormatConfig {
	currency: IFormatConfig;
	digit: IFormatConfig;
	int: IFormatConfig;
	float: IFormatConfig;
	boolean: IFormatConfig;
}

export class ModelFormatConfig {
	public static getConfig(): IModelFormatConfig {
		return {
			currency: {
				formatter(args) {
					const modelValue = args.$modelValue;
					const filter = args.$filter;
					const attrs = args.$attrs;
					const $eval = args.$eval;
					const val = filter('currency')(modelValue);
					return attrs.prefixed && $eval(attrs.prefixed) ? val : val ? val.substr(1) : '';
				},
				parser(args) {
					const viewValue = args.$viewValue;
					const num = viewValue ? viewValue.replace(/[^0-9.]/g, '') : ''; // replace not a function - viewvalue undefined
					const result = parseFloat(num);
					return isNaN(result) ? undefined : parseFloat(result.toFixed(2));
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;
					const viewValue = args.$viewValue;

					if (
						!(
							ModelFormatConfig.keyHelper.smallKeyBoard(event) ||
							ModelFormatConfig.keyHelper.numberKeyBpoard(event) ||
							ModelFormatConfig.keyHelper.functionKeyBoard(event) ||
							ModelFormatConfig.keyHelper.currencyKeyBoard(event, viewValue) ||
							ModelFormatConfig.keyHelper.floatKeyBoard(event, viewValue)
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
					return args.$viewValue ? args.$viewValue.replace(/[^0-9]/g, '') : undefined;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown: ModelFormatConfig.keyDownHandler
			},
			int: {
				formatter: ModelFormatConfig.formatHandler,
				parser(args) {
					const val = parseInt(args.$viewValue.replace(/[^0-9]/g, ''), 10);
					return isNaN(val) ? undefined : val;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown: ModelFormatConfig.keyDownHandler
			},
			float: {
				formatter: ModelFormatConfig.formatHandler,
				parser(args) {
					const val = parseFloat(args.$viewValue.replace(/[^0-9.]/g, ''));
					const ENOB = 3;
					const tempNum = Math.pow(10, ENOB);
					return isNaN(val) ? undefined : Math.round(val * tempNum) / tempNum;
				},
				isEmpty(value) {
					return !value.$modelValue;
				},
				keyDown(args) {
					const event = args.$event;
					const viewValue = args.$viewValue;

					if (
						!(
							ModelFormatConfig.keyHelper.smallKeyBoard(event) ||
							ModelFormatConfig.keyHelper.numberKeyBpoard(event) ||
							ModelFormatConfig.keyHelper.functionKeyBoard(event) ||
							ModelFormatConfig.keyHelper.floatKeyBoard(event, viewValue)
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
		};
	}

	private static keyHelper = {
		smallKeyBoard(event: KeyboardEvent) {
			const which = event.which;
			return which >= 96 && which <= 105;
		},
		numberKeyBpoard(event: KeyboardEvent) {
			const which = event.which;
			return which >= 48 && which <= 57 && !event.shiftKey;
		},
		functionKeyBoard(event: KeyboardEvent) {
			const which = event.which;
			return which <= 40 || (navigator.platform.indexOf('Mac') > -1 && event.metaKey) || (navigator.platform.indexOf('Win') > -1 && event.ctrlKey);
		},
		currencyKeyBoard(event: KeyboardEvent, viewValue: number | string) {
			const which = event.which;
			return viewValue.toString().indexOf('$') === -1 && which === 52 && event.shiftKey;
		},
		floatKeyBoard(event: KeyboardEvent, viewValue: number | string) {
			const which = event.which;
			return [188].indexOf(which) !== -1 || ((which === 190 || which === 110) && viewValue.toString().indexOf('.') === -1);
		}
	};

	private static keyDownHandler(args: any): void {
		const event = args.$event;

		if (!(ModelFormatConfig.keyHelper.smallKeyBoard(event) || ModelFormatConfig.keyHelper.numberKeyBpoard(event) || ModelFormatConfig.keyHelper.functionKeyBoard(event))) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	private static formatHandler = (args: any): string => {
		const modelValue = args.$modelValue;
		const filter = args.$filter;
		return filter('number')(modelValue);
	};
}
