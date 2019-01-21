const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyWebpackPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TSLintPlugin = require('tslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

const postCSSLoader = {
	loader: 'postcss-loader',
	options: {
		plugins: () => ([autoprefixer]),
	},
};

exports.devServer = ({ host, port } = {}) => ({
	devServer: {
		historyApiFallback: true,
		stats: 'errors-only',
		host,
		port,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
		},
		overlay: {
			errors: true,
			warnings: true,
		},
	},
});

exports.loadLiveReload = () => ({
	plugins: [
		new LiveReloadPlugin()
	],
})

exports.loadServerViews = () => ({
	plugins: [
		// Copy the server views to the public/dist folder
		// This is required so that webpack can inject the <script> tags referencing the hashed bundles
		new HtmlWebpackPlugin({
			template: 'modules/core/server/views/layout.server.view.html',
			filename: 'server-views/layout.server.view.html'
		}),
		new HtmlWebpackPlugin({
			template: 'modules/core/server/views/index.server.view.html',
			filename: 'server-views/index.server.view.html'
		}),
		new HtmlWebpackPlugin({
			template: 'modules/core/server/views/500.server.view.html',
			filename: 'server-views/500.server.view.html'
		}),
		new HtmlWebpackPlugin({
			template: 'modules/core/server/views/404.server.view.html',
			filename: 'server-views/404.server.view.html'
		}),
		new HtmlWebpackPlugin({
			template: 'modules/users/server/templates/reset-password-confirm-email.server.view.html',
			filename: 'server-views/reset-password-confirm-email.server.view.html'
		}),
		new HtmlWebpackPlugin({
			template: 'modules/users/server/templates/reset-password-email.server.view.html',
			filename: 'server-views/reset-password-email.server.view.html'
		}),
	],
});

exports.loadHashedModuleIds = () => ({
	plugins: [
		new webpack.HashedModuleIdsPlugin()
	],
});

exports.loadHtml = () => ({
	resolve: {
		extensions: ['.html'],
	},
	module: {
		rules: [
			{
				test: /\.(html)$/,
				use: {
					loader: 'html-loader',
				}
			}
		]
	}
});

exports.loadTS = ({ include, exclude } = {}) => ({
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [
			{
				// Include ts, tsx, and js files.
				test: /\.(tsx?)|(js)$/,
				include,
				exclude,
				loader: 'babel-loader',
				options: {
					sourceMaps: "both"
				}
			},
		],
	},
});

exports.loadCSS = ({ include, exclude } = {}) => ({
	module: {
		rules: [
			{
				test: /\.s?css$/,
				include,
				exclude,
				use: [
					'style-loader',
					'css-loader',
					postCSSLoader,
					'sass-loader',
				],
			},
			{
				test: /\.less$/,
				include,
				exclude,
				use: [
					'style-loader',
					'css-loader',
					postCSSLoader,
					'less-loader',
				],
			},
		],
	}
});

exports.extractCSS = ({ include, exclude, filename } = {}) => ({
	module: {
		rules: [
			{
				test: /\.s?css$/,
				include,
				exclude,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					postCSSLoader,
					'sass-loader',
				],
			},
			{
				test: /\.less$/,
				include,
				exclude,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					postCSSLoader,
					'less-loader',
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename,
		}),
	],
});

exports.loadImages = ({ include, exclude, urlLoaderOptions } = {}) => ({
	module: {
		rules: [
			{
				test: /\.(gif|png|jpe?g|svg)$/,
				include,
				exclude,
				loader: 'url-loader',
				options: urlLoaderOptions,
			}
		],
	},
});

exports.loadFonts = ({ include, exclude, urlLoaderOptions } = {}) => ({
	module: {
		rules: [
			{
				// Match woff2 in addition to patterns like .woff?v=1.1.1
				test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
				include,
				exclude,
				use: {
					loader: 'url-loader',
					options: urlLoaderOptions,
				},
			}
		],
	},
});

exports.loadTinyMCE = () => ({
	module: {
		rules: [
			{
				test: require.resolve('tinymce/tinymce'),
				use: ['imports-loader?this=>window', 'exports-loader?window.tinymce']
			},
			{
				test: /tinymce\/(themes|plugins)\//,
				use: ['imports-loader?this=>window']
			},
		],
	},
});

exports.generateSourceMaps = ({ type } = {}) => ({
	devtool: type,
});

exports.minifyJS = () => ({
	optimization: {
		minimize: true
	},
});

exports.splitVendorChunks = () => ({
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /node_modules/,
					chunks: 'initial',
					name: 'vendor',
					enforce: true,
				}
			}
		}
	},
});

exports.minifyCSS = ({ options } = {}) => ({
	plugins: [
		new OptimizeCSSAssetsPlugin({
			cssProcessor: cssnano,
			cssProcessorOptions: options,
			canPrint: false,
		}),
	],
});

exports.setEnvironmentVariables = (dotenv = {}) => ({
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				...dotenv
			},
		}),
	],
});

exports.gZipCompression = () => ({
	plugins: [
		new CompressionPlugin({
			algorithm: 'gzip',
		}),
	],
});

exports.provideJQuery = () => ({
	plugins: [
		new webpack.ProvidePlugin({
			jQuery: 'jquery'
		}),
	],
});

exports.clean = (path) => ({
	plugins: [
		new CleanWebpackPlugin([
			path,
		]),
	],
});

exports.copy = (from, to) => ({
	plugins: [
		new CopyWebpackPlugin([
			{ from, to, ignore: ['*.html'] },
		]),
	],
});
