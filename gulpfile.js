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
	ts = require('gulp-typescript'),
	sourcemaps = require('gulp-sourcemaps'),
	path = require('path'),
	plugins = gulpLoadPlugins(),
	webpack = require('webpack'),
	webpack_stream = require('webpack-stream'),
	webpack_config = require('./webpack.config.js');

// Define paths for webpack
const paths = require('./paths');

const tsProject = ts.createProject({
	target: 'es2015',
	module: 'commonjs',
	moduleResolution: 'node',
	sourceMap: true,
	emitDecoratorMetadata: true,
	experimentalDecorators: true,
	removeComments: true,
	noImplicitAny: false,
	allowJs: true,
	outDir: "./server-dist"
});

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

// TypeScript (server)
gulp.task('tsc-server', () => {

	return gulp.src(_.union(defaultAssets.server.allTS, defaultAssets.server.allJS), { base: './' })
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '' }))
		.pipe(gulp.dest(path.resolve('./server-dist')));
});

gulp.task('ts-watch', () => {
	return new Promise((resolve) => {
		gulp.watch(defaultAssets.server.allTS, gulp.task('tsc-server'));
		resolve();
	});
});

// Nodemon task
gulp.task('nodemon', () => {
	return new Promise((resolve, reject) => {
		plugins.nodemon({
			script: 'server-dist/server.js',
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
			script: 'server-dist/server.js',
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
gulp.task('build', gulp.series('env:prod', 'webpack', 'tsc-server'));

// Run without watch - used when developing containerized solution to keep machines from spinning up
gulp.task('quiet', gulp.series('env:dev', 'webpack', 'tsc-server', 'nodemon'));

// Run the project in development mode (watch/livereload on webpack)
gulp.task('default', gulp.series('env:dev', 'webpack-watch', 'tsc-server', gulp.parallel('nodemon', 'ts-watch')));

// Run the project but automatically break on init - used for debugging startup issues
gulp.task('debug', gulp.series('env:dev', 'webpack-watch', 'tsc-server', 'nodemon-debug'));

// Run the project in production mode
gulp.task('prod', gulp.series('env:prod', 'webpack', 'tsc-server', 'nodemon'));
