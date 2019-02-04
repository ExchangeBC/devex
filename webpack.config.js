const webpack = require('webpack');
const merge = require('webpack-merge');

const path = require('path');
const glob = require('glob');
const minimatch = require('minimatch');
const dotenv = require('dotenv').config({ path: __dirname + '/.env' });

// various webpack goodies
const parts = require('./webpack.parts');

// application-specific PATHS
const paths = require('./paths');

const DEVELOPMENT = 'development';
const PRODUCTION = 'production';
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const ASSET_PATH = process.env.ASSET_PATH || '/dist';

const envFile = {};
envFile['BASE_PATH'] = JSON.stringify('');
// Populate the env dict with Environment variables from the system
if (process.env) {
	Object.keys(process.env).map(key => {
		envFile[key] = JSON.stringify(process.env[key]);
	});
}
// Update the env dict with any in the .env file
if (dotenv.parsed) {
	Object.keys(dotenv.parsed).map(key => {
		envFile[key] = JSON.stringify(dotenv.parsed[key]);
	});
}

const BUILD_FILE_NAMES = {
	css: '[name].[contentHash].css',
	bundle: '[name].[contentHash].bundle.js',
	assets: 'assets/[name].[hash:4].[ext]',
};

const commonConfig = merge([
	{
		entry: {
			main: [
				'./vendor.ts',
				'./modules/core/client/app/ApplicationConfiguration.ts'
			].concat(
				glob.sync('./modules/*/client/*.{js,ts}'),
				glob.sync('./modules/*/client/**/*.{js,ts}', {
					ignore: [
						'./modules/*/client/*.{js,ts}',
						'./main.js',
						'./modules/core/client/app/ApplicationConfiguration.ts'
					]
				}),
				glob.sync('./modules/*/client/**/*.html'),
			),
		},
		resolve: {
			// These files are tried when trying to resolve a directory...
			//  - i.e. require("/some/dir") -> require("some/dir/index.js")
			mainFiles: ['index', 'compile/minified/ng-img-crop']
		},
	},
	parts.loadServerViews(),
	parts.setEnvironmentVariables(envFile),
	parts.loadFonts({
		urlLoaderOptions: {
			// Inline files smaller than 10 kB (10240 bytes)
			limit: 10 * 1024,
			name: 'fonts/[name].[ext]',
			publicPath: ASSET_PATH,
			fallback: 'file-loader',
		}
	}),
	parts.loadTS({
		exclude: /node_modules/,
	}),
	parts.provideJQuery(),
]);

const devConfig = merge([
	{
		output: {
			path: paths.build,
			publicPath: ASSET_PATH,
			filename: BUILD_FILE_NAMES.bundle,
		},
		watch: true,
	},
	parts.clean(paths.build),
	parts.loadLiveReload(),
	parts.loadHashedModuleIds(),
	parts.generateSourceMaps({
		type: "source-map",
	}),
	parts.splitVendorChunks({
		filename: BUILD_FILE_NAMES.vendor,
	}),
	parts.loadHtml(),
	parts.extractCSS({
		filename: BUILD_FILE_NAMES.css,
	}),
	parts.loadTinyMCE(),
	parts.loadImages({
		urlLoaderOptions: {
			// Inline files smaller than 10 kB (10240 bytes)
			limit: 10 * 1024,
			name: 'images/[name].[ext]',
			publicPath: ASSET_PATH,
			fallback: 'file-loader',
		},
	}),
]);

const prodConfig = merge([
	{
		output: {
			path: paths.build,
			publicPath: ASSET_PATH,
			filename: BUILD_FILE_NAMES.bundle,
		},
	},
	parts.clean(paths.build),
	parts.loadHashedModuleIds(),
	parts.splitVendorChunks(),
	parts.loadHtml(),
	parts.extractCSS({
		filename: BUILD_FILE_NAMES.css,
	}),
	parts.loadTinyMCE(),
	parts.loadImages({
		urlLoaderOptions: {
			// Inline files smaller than 10 kB (10240 bytes)
			limit: 10 * 1024,
			name: 'fonts/[name].[ext]',
			publicPath: ASSET_PATH,
			fallback: 'file-loader',
		},
	}),
	parts.minifyJS(),
]);

module.exports = (mode) => {
	// return env-specific configuration - i.e. dev vs prod
	const config = mode === PRODUCTION ? prodConfig : devConfig;
	return merge(commonConfig, config, { mode });
};
