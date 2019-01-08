'use strict';

import angular, { IFilterFunction } from 'angular';

(() => {
	angular
		.module('core')

		.filter(
			'columnRanges',
			(): IFilterFunction => {
				const memo = [];
				return (items: any[], count: number) => {
					if (count < 1) {
						count = 1;
					}
					const itemlen = items ? items.length : 0;
					const len = count === 1 ? itemlen : Math.floor(itemlen / count) + (itemlen % count);
					if (!memo[count]) {
						memo[count] = [];
					}
					if (!memo[count][len]) {
						const arr = [];
						let i = 0;
						let start = 0;
						if (itemlen) {
							for (; i < count; i++) {
								arr.push({
									start,
									end: Math.min(start + len, itemlen)
								});
								start += len;
							}
						}
						memo[count][len] = arr;
					}
					return memo[count][len];
				};
			}
		);
})();
