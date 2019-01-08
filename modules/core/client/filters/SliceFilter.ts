'use strict';

import angular, { IFilterFunction } from 'angular';

(() => {
	angular
		.module('core')

		.filter(
			'slice',
			(): IFilterFunction => {
				return (arr: any[], start: number, end: number): any[] => {
					if (!arr || !arr.slice) {
						return;
					}
					return arr.slice(start, end);
				};
			}
		);
})();
