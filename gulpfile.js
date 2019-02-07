'use strict';

const _ = require('lodash'),
	fs = require('fs'),
	defaultAssets = require('./config/assets/assets'),
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
	outDir: './server-dist',
	esModuleInterop: true
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

	return gulp
		.src(_.union(defaultAssets.server.allTS, defaultAssets.server.allJS), { base: './' })
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(
			sourcemaps.write('.', {
				mapSources: path => path,
				sourceRoot: file => {
					return path.relative(file.relative, path.join(file.cwd, './server-dist'));
				}
			})
		)
		.pipe(gulp.dest(path.resolve('./server-dist')));
});

// Nodemon task
gulp.task('nodemon', () => {
	return new Promise(resolve => {
		plugins.nodemon({
			script: 'server-dist/server.js',
			nodeArgs: ['--inspect=0.0.0.0:9229', '-r', 'dotenv/config'],
			ext: 'ts,js,html',
			tasks: ['tsc-server'],
			watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.allTS)
		});
		resolve();
	});
});

// Nodemon debug task
gulp.task('nodemon-debug', function() {
	return new Promise(resolve => {
		plugins.nodemon({
			script: 'server-dist/server.js',
			nodeArgs: ['--inspect-brk=0.0.0.0:9229', '-r', 'dotenv/config'],
			ext: 'ts,js,html',
			verbose: true,
			tasks: ['tsc-server'],
			watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.allTS)
		});
		resolve();
	});
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

// Run without livereload/webpack watch - used when developing containerized solution to keep machines from spinning up
gulp.task('quiet', gulp.series('env:dev', 'webpack', 'tsc-server', 'nodemon'));

// Run the project in development mode (watch/livereload on webpack)
gulp.task('default', gulp.series('env:dev', 'webpack-watch', 'tsc-server', 'nodemon'));

// Run the project but automatically break on init - used for debugging startup issues
gulp.task('debug', gulp.series('env:dev', 'webpack-watch', 'tsc-server', 'nodemon-debug'));

// Run the project in production mode
gulp.task('prod', gulp.series('env:prod', 'webpack', 'tsc-server', 'nodemon'));
