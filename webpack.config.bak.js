const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: {
		vendor: [
			'angular',
			'angular-animate',
			'angular-breadcrumb',
			'angular-messages',
			'angular-mocks',
			'angular-resource',
			'angular-ui-notification',
			'angular-ui-router',
			'angular-ui-tinymce',
			'ng-img-crop',
			'ng-file-upload',
			'ng-idle',
			'angular-drag-and-drop-lists',
			'angular-sanitize',
			'jquery',
			'bootstrap',
			'ui-bootstrap4'
		],
		appConfig: './modules/core/client/app/config.js',
		appInit: './modules/core/client/app/init.js',
		moduleConfig: glob.sync('./modules/*/client/*.js'),
		modules: glob.sync('./modules/*/client/**/*.js', {
			ignore: [
				'./modules/*/client/*.js',
				'./main.js',
				'./modules/core/client/app/config.js',
				'./modules/core/client/app/init.js'
			]
		})
	},
	output: {
		path: path.join(__dirname, './public/dist'),
		filename: '[name].bundle.js'
	},
	devtool: 'source-map',
	resolve: {
		mainFiles: ['index', 'compile/minified/ng-img-crop']
	},
	optimization: {
		minimize: true
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader']
			},
			{
				test: /\.less$/,
				use: [{ loader: MiniCssExtractPlugin.loader }, { loader: 'css-loader' }, { loader: 'less-loader' }]
			},
			{
				test: require.resolve('tinymce/tinymce'),
				use: ['imports-loader?this=>window', 'exports-loader?window.tinymce']
			},
			{
				test: /tinymce\/(themes|plugins)\//,
				use: ['imports-loader?this=>window']
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
				loader: 'url-loader?limit=10000'
			},
			{
				test: /\.(eot|ttf|wav|mp3)$/,
				loader: 'file-loader'
			},
			{
				test: /\.scss$/,
				use: [{ loader: MiniCssExtractPlugin.loader }, { loader: 'css-loader' }, { loader: 'sass-loader' }]
			}
		]
	},
	node: {
		console: true,
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	},
	plugins: [
		new webpack.ProvidePlugin({
			jQuery: 'jquery'
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css'
		})
	]
	// stats: 'errors-only'
};
