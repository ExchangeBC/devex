'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
	client: {
		lib: {
			css: [],  // deprecated - see webpack and vendor.ts
			js: []    // deprecated - see webpack and vendor.ts
		},
		css: 'public/dist/application*.min.css',
		js: []  // deprecated - see webpack and vendor.ts
	}
};
