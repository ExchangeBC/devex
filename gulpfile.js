'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	fs = require('fs'),
	defaultAssets = require('./config/assets/default'),
	testAssets = require('./config/assets/test'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	runSequence = require('run-sequence'),
	plugins = gulpLoadPlugins({
		rename: {
			'gulp-angular-templatecache': 'templateCache'
		}
	}),
	path = require('path'),
	endOfLine = require('os').EOL,
	del = require('del'),
	vinylPaths = require('vinyl-paths'),
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

// Clean task
gulp.task('clean', () => {
	return gulp.src(`${paths.build}/*`).pipe(vinylPaths(del));
});

// Webpack task
gulp.task('webpack', () => {
	// load separate webpack configurations for each environment
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

// Watch Files For Changes
gulp.task('watch', () => {
	return new Promise((resolve, reject) => {
		// Start livereload
		plugins.refresh.listen();

		if (!process.env.DISABLE_WATCH) {
			// Add watch rules
			gulp.watch(defaultAssets.server.views).on('change', plugins.refresh.changed);
			gulp.watch(defaultAssets.server.allJS, gulp.series('eslint')).on('change', plugins.refresh.changed);
			// gulp.watch(defaultAssets.client.js, gulp.series('eslint')).on('change', plugins.refresh.changed);
			gulp.watch(defaultAssets.client.css, gulp.series('csslint')).on('change', plugins.refresh.changed);
			gulp.watch(defaultAssets.client.sass, gulp.parallel('sass', 'csslint')).on(
				'change',
				plugins.refresh.changed
			);
			gulp.watch(defaultAssets.client.less, gulp.parallel('less', 'csslint')).on(
				'change',
				plugins.refresh.changed
			);

			if (process.env.NODE_ENV === 'production') {
				gulp.watch(defaultAssets.server.gulpConfig, gulp.parallel('templatecache', 'eslint'));
				gulp.watch(defaultAssets.client.views, gulp.parallel('templatecache')).on(
					'change',
					plugins.refresh.changed
				);
			} else {
				gulp.watch(defaultAssets.server.gulpConfig, gulp.series('eslint'));
				gulp.watch(defaultAssets.client.views).on('change', plugins.refresh.changed);
			}
		}
		resolve();
	});
});

// CSS linting task
gulp.task('csslint', () => {
	return gulp
		.src(defaultAssets.client.css)
		.pipe(plugins.csslint('.csslintrc'))
		.pipe(plugins.csslint.formatter());
});

// Compile theme CSS
gulp.task('themecss', () => {
	return gulp
		.src(defaultAssets.client.theme.sass.entry)
		.pipe(plugins.sass())
		.pipe(plugins.autoprefixer())
		.pipe(plugins.concat('theme.css'))
		.pipe(gulp.dest('public/dist'));
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

// JS minifying task
gulp.task('uglify', () => {
	var assets = _.union(defaultAssets.client.js, defaultAssets.client.templates);
	del(['public/dist/*.js']);

	return gulp
		.src(assets)
		.pipe(plugins.ngAnnotate())
		.pipe(
			plugins.uglify({
				mangle: false
			})
		)
		.pipe(plugins.concat('application.min.js'))
		.pipe(plugins.rev())
		.pipe(gulp.dest('public/dist'));
});

// CSS minifying task
gulp.task('cssmin', () => {
	del(['public/dist/application*.css']);

	return gulp
		.src(defaultAssets.client.css)
		.pipe(plugins.csso())
		.pipe(plugins.concat('application.min.css'))
		.pipe(plugins.rev())
		.pipe(gulp.dest('public/dist'));
});

// Sass task
gulp.task('sass', () => {
	return gulp
		.src(defaultAssets.client.sass)
		.pipe(plugins.sass())
		.pipe(plugins.autoprefixer())
		.pipe(
			plugins.rename(file => {
				file.dirname = file.dirname.replace(path.sep + 'scss', path.sep + 'css');
			})
		)
		.pipe(gulp.dest('./modules/'));
});

// Less task
gulp.task('less', () => {
	return gulp
		.src(defaultAssets.client.less)
		.pipe(plugins.less())
		.pipe(plugins.autoprefixer())
		.pipe(
			plugins.rename(file => {
				file.dirname = file.dirname.replace(path.sep + 'less', path.sep + 'css');
			})
		)
		.pipe(gulp.dest('./modules/'));
});

// Make sure upload directory exists
gulp.task('makeUploadsDir', () => {
	return fs.mkdir('modules/core/client/img/uploads', err => {
		if (err && err.code !== 'EEXIST') {
			console.error(err);
		}
	});
});

// Angular template cache task
gulp.task('templatecache', () => {
	return gulp
		.src(defaultAssets.client.views)
		.pipe(
			plugins.templateCache('templates.js', {
				root: 'modules/',
				module: 'core',
				templateHeader:
					'(function () {' +
					endOfLine +
					'	\'use strict\';' +
					endOfLine +
					endOfLine +
					'	angular' +
					endOfLine +
					'		.module(\'<%= module %>\'<%= standalone %>)' +
					endOfLine +
					'		.run(templates);' +
					endOfLine +
					endOfLine +
					'	templates.$inject = [\'$templateCache\'];' +
					endOfLine +
					endOfLine +
					'	function templates($templateCache) {' +
					endOfLine,
				templateBody: '		$templateCache.put(\'<%= url %>\', \'<%= contents %>\');',
				templateFooter: '	}' + endOfLine + '})();' + endOfLine
			})
		)
		.pipe(gulp.dest('build'));
});

// Lint CSS and JavaScript files.
gulp.task('lint', gulp.series('sass', 'themecss', 'eslint'));

// Lint project files and run webpack
gulp.task('build', gulp.series('env:prod', 'lint', 'clean', 'webpack'));

// Run without watch - used when developing containerized solution to keep machines from spinning up
gulp.task('quiet', gulp.series('env:dev', 'lint', 'nodemon'));

// Run the project in development mode
gulp.task('default', gulp.series('env:dev', 'lint', 'clean', 'webpack', gulp.parallel('nodemon', 'watch')));

// Run the project but automatically break on init - used for debugging startup issues
gulp.task('debug', gulp.series('env:dev', 'lint', gulp.parallel('nodemon-debug', 'watch')));

// Run the project in production mode
gulp.task('prod', gulp.series('templatecache', 'clean', 'webpack', 'env:prod', gulp.parallel('nodemon', 'watch')));
