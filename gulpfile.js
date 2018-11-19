'use strict';

/**
 * Module dependencies.
 */
const _ = require('lodash'),
	fs = require('fs'),
	defaultAssets = require('./config/assets/default'),
	testAssets = require('./config/assets/test'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins(),
	webpack = require('webpack'),
	webpack_stream = require('webpack-stream'),
	webpack_config = require('./webpack.config.js');

// Define paths for webpack
const paths = require('./paths');

// Set NODE_ENV to 'test'
gulp.task('env:test', function() {
	process.env.NODE_ENV = 'test';
});

// Set NODE_ENV to 'development'
gulp.task('env:dev', () => {
	return new Promise((resolve, reject) => {
		process.env.NODE_ENV = 'development';
		resolve();
	});
});

// Set NODE_ENV to 'production'
gulp.task('env:prod', () => {
	return new Promise((resolve, reject) => {
		process.env.NODE_ENV = 'production';
		resolve();
	});
});

// Webpack task with watch
gulp.task('webpack-watch', callback => {
	var webpackStatsConfig = {
		colors: true,
		hash: false,
		version: false,
		timings: false,
		assets: true,
		chunks: false,
		chunkModules: false,
		modules: false,
		children: false,
		cached: false,
		cachedAssets: false,
		reasons: false,
		source: false,
		errorDetails: false,
		chunkOrigins: false
	};

	// load separate webpack configurations for each environment
	const config = webpack_config(process.env.NODE_ENV);
	return webpack_stream(config, webpack, (err, stats) => {
		console.log(stats.toString(webpackStatsConfig));
		callback();
	}).pipe(gulp.dest(`${paths.build}`));
});

// Webpack
gulp.task('webpack', callback => {
	const config = webpack_config(process.env.NODE_ENV);
	return webpack_stream(config).pipe(gulp.dest(`${paths.build}`));
});

// Nodemon task
gulp.task('nodemon', () => {
	return new Promise((resolve, reject) => {
		plugins.nodemon({
			script: 'server.js',
			nodeArgs: ['--inspect=0.0.0.0:9229', '-r', 'dotenv/config'],
			ext: 'ts,js,html',
			watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
		});
		resolve();
	});
});

// Nodemon debug task
gulp.task('nodemon-debug', function() {
	return new Promise((resolve, reject) => {
		plugins.nodemon({
			script: 'server.js',
			nodeArgs: ['--inspect-brk=0.0.0.0:9229', '-r', 'dotenv/config'],
			ext: 'ts,js,html',
			verbose: true,
			watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
		});
		resolve();
	});
});

// ESLint JS linting task
gulp.task('eslint', () => {
	var assets = _.union(
		defaultAssets.server.gulpConfig,
		defaultAssets.server.allJS,
		// defaultAssets.client.js,
		testAssets.tests.server,
		testAssets.tests.client,
		testAssets.tests.e2e
	);

	return gulp
		.src(assets)
		.pipe(plugins.eslint())
		.pipe(plugins.eslint.format());
});

// Make sure upload directory exists
gulp.task('makeUploadsDir', () => {
	return fs.mkdir('modules/core/client/img/uploads', err => {
		if (err && err.code !== 'EEXIST') {
			console.error(err);
		}
	});
});

// Lint project files and run webpack
gulp.task('build', gulp.series('env:prod', 'eslint', 'webpack'));

// Run without watch - used when developing containerized solution to keep machines from spinning up
gulp.task('quiet', gulp.series('env:dev', 'eslint', 'webpack', 'nodemon'));

// Run the project in development mode (watch/livereload on webpack)
gulp.task('default', gulp.series('env:dev', 'eslint', 'webpack-watch', 'nodemon'));

// Run the project but automatically break on init - used for debugging startup issues
gulp.task('debug', gulp.series('env:dev', 'eslint', 'webpack-watch', 'nodemon-debug'));

// Run the project in production mode
gulp.task('prod', gulp.series('env:prod', 'eslint', 'webpack', 'nodemon'));
