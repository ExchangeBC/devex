'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
	client: {
		lib: {
			css: [],  // deprecated - see webpack and vendor.ts
			js: [],   // deprecated - see webpack and vendor.ts
			tests: ['public/lib/angular-mocks/angular-mocks.js']
		},
		theme: {
			less: {
				// includes bootstrap
				entry: 'public/less/theme.less',
				watch: ['public/less/include/*.less']
			},
			sass: {
				entry: 'public/sass/theme.scss',
				watch: ['public/sass/include/*.scss']
			}
		},
		css: ['public/dist/theme.css', 'public/css/*.css', 'modules/*/client/css/*.css'],
		less: ['modules/*/client/less/*.less'],
		sass: ['modules/*/client/scss/*.scss'],
		js: [],  // deprecated - see webpack and vendor.ts
		img: [
			'modules/**/*/img/**/*.jpg',
			'modules/**/*/img/**/*.png',
			'modules/**/*/img/**/*.gif',
			'modules/**/*/img/**/*.svg'
		],
		views: ['modules/*/client/views/**/*.html'],
		templates: ['build/templates.js']
	},
	server: {
		gulpConfig: ['gulpfile.js'],
		allJS: ['config/**/*.js', 'modules/*/server/**/*.js', 'modules/*/server/config/*.js', 'paths.js'],
		routes: ['modules/*/server/routes/**/*.js'],
		sockets: 'modules/*/server/sockets/**/*.js',
		config: ['modules/*/server/config/*.js'],
		policies: ['modules/*/server/policies/*.js'],
		views: ['modules/*/server/views/*.html'],
		allTS: ['config/**/*.ts', 'modules/*/server/**/*.ts', 'server.ts']
	}
};
