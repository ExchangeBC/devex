/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';
import _ from 'lodash';
import path from 'path';

class ApplicationConfig {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ApplicationConfig;

	private config: any = {};

	private constructor() {
		this.initGlobalConfig();
	}

	public getConfig() {
		return this.config;
	}

	// Initialize global configuration
	private initGlobalConfig = () => {
		// Validate NODE_ENV existence
		this.validateEnvironmentVariable();

		// Get the default assets
		const assets = require(path.join(process.cwd(), 'config/assets/assets'));

		// Get the default config
		const defaultConfig = require(path.join(process.cwd(), 'config/env/default'));

		// Get the current config
		const environmentConfig = require(path.join(process.cwd(), 'config/env/', process.env.NODE_ENV)) || {};

		// Merge config files
		this.config = _.merge(defaultConfig, environmentConfig);

		// read package.json for MEAN.JS project information
		const pkg = require(path.resolve('./package.json'));
		this.config.pkg = pkg;

		// Extend the config object with the local-NODE_ENV.js custom/local environment. This will override any settings present in the local configuration.
		this.config = _.merge(
			this.config,
			(fs.existsSync(path.join(process.cwd(), 'config/env/local-' + process.env.NODE_ENV + '.js')) && require(path.join(process.cwd(), 'config/env/local-' + process.env.NODE_ENV + '.js'))) || {}
		);

		// Initialize global globbed files
		this.initGlobalConfigFiles(this.config, assets);

		// Initialize global globbed folders
		this.initGlobalConfigFolders(this.config, assets);

		// Validate Secure SSL mode can be used
		this.validateSecureMode(this.config);

		// Validate session secret
		this.validateSessionSecret(this.config);

		// Print a warning if config.domain is not set
		this.validateDomainIsSet(this.config);

		return this.config;
	};

	// Get globbed file name paths
	private getGlobbedPaths = (globPatterns, excludes?) => {
		// URL paths regex
		const urlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

		// The output array
		let output = [];

		// If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
		if (_.isArray(globPatterns)) {
			globPatterns.forEach(globPattern => {
				output = _.union(output, this.getGlobbedPaths(globPattern, excludes));
			});
		} else if (_.isString(globPatterns)) {
			if (urlRegex.test(globPatterns)) {
				output.push(globPatterns);
			} else {
				let files = glob.sync(globPatterns);
				if (excludes) {
					files = files.map(file => {
						if (_.isArray(excludes)) {
							for (const i in excludes) {
								if (excludes.hasOwnProperty(i)) {
									file = file.replace(excludes[i], '');
								}
							}
						} else {
							file = file.replace(excludes, '');
						}
						return file;
					});
				}
				output = _.union(output, files);
			}
		}

		return output;
	};

	// Validate NODE_ENV existence
	private validateEnvironmentVariable = () => {
		const environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
		console.log();
		if (!environmentFiles.length) {
			if (process.env.NODE_ENV) {
				console.error(chalk.red('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead'));
			} else {
				console.error(chalk.red('+ Error: NODE_ENV is not defined! Using default development environment'));
			}
			process.env.NODE_ENV = 'development';
		}
		// Reset console color
		console.log(chalk.white(''));
	};

	// Validate config.domain is set
	private validateDomainIsSet = config => {
		if (!config.app.domain) {
			console.log(chalk.red('+ Important warning: config.domain is empty. It should be set to the fully qualified domain of the app.'));
		}
	};

	//  Validate Secure=true parameter can actually be turned on
	//  because it requires certs and key files to be available
	private validateSecureMode = config => {
		if (!config.secure || config.secure.ssl !== true) {
			return true;
		}

		const privateKey = fs.existsSync(path.resolve(config.secure.privateKey));
		const certificate = fs.existsSync(path.resolve(config.secure.certificate));

		if (!privateKey || !certificate) {
			console.log(chalk.red('+ Error: Certificate file or key file is missing, falling back to non-SSL mode'));
			console.log(chalk.red('  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh'));
			console.log();
			config.secure.ssl = false;
		}
	};

	// Validate Session Secret parameter is not set to default in production
	private validateSessionSecret = (config, testing?) => {
		if (process.env.NODE_ENV !== 'production') {
			return true;
		}

		if (config.sessionSecret === 'MEAN') {
			if (!testing) {
				console.log(chalk.red('+ WARNING: It is strongly recommended that you change sessionSecret config while running in production!'));
				console.log(chalk.red("  Please add `sessionSecret: process.env.SESSION_SECRET || 'super amazing secret'` to "));
				console.log(chalk.red('  `config/env/production.js` or `config/env/local.js`'));
				console.log();
			}
			return false;
		} else {
			return true;
		}
	};

	// Initialize global configuration files
	private initGlobalConfigFolders = (config, assets) => {
		// Appending files
		config.folders = {
			server: {},
			client: {}
		};

		// Setting globbed client paths
		config.folders.client = this.getGlobbedPaths(path.join(process.cwd(), 'modules/*/client/'), process.cwd().replace(new RegExp(/\\/g), '/'));
	};

	// Initialize global configuration files
	private initGlobalConfigFiles = (config, assets) => {
		// Appending files
		config.files = {
			client: {}
		};

		// Setting Globbed js files
		config.files.client.js = this.getGlobbedPaths(assets.client.lib.js, 'public/').concat(this.getGlobbedPaths(assets.client.js, ['public/']));

		// Setting Globbed css files
		config.files.client.css = this.getGlobbedPaths(assets.client.lib.css, 'public/').concat(this.getGlobbedPaths(assets.client.css, ['public/']));

		// Setting Globbed test files
		config.files.client.tests = this.getGlobbedPaths(assets.client.tests);
	};
}

export default ApplicationConfig.getInstance().getConfig();
