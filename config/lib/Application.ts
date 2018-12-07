/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import { Express } from 'express';
import config from '../config';
import ExpressApplication from './ExpressApplication';
import MongooseController from './MongooseController';
import seed from './Seed';

class Application {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: Application;

	private constructor() {}

	public init = (): Promise<Express> => {
		return new Promise(resolve => {
			let connection;
			Promise.resolve()
				.then(MongooseController.connect)
				.then(conn => {
					connection = conn;
				})
				.then(this.seedDB)
				.then(() => {
					resolve(ExpressApplication.init(connection));
				});
		});
	};

	public start = () => {
		this.init().then(app => {
			// Start the app by listening on <port> at <host>
			app.listen(config.port, config.host, () => {
				// Create server URL
				const server = (config.secure && config.secure.ssl ? 'https://' : 'http://') + config.host + ':' + config.port;
				// Logging initialization
				console.log('--');
				console.log(chalk.green(config.app.title));
				console.log();
				console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
				console.log(chalk.green('Server:          ' + server));
				console.log(chalk.green('Database:        ' + config.db.uri));
				console.log(chalk.green('App version:     ' + config.meanjs.version));
				console.log('--');
			});
		});
	};

	private seedDB() {
		return new Promise(resolve => {
			if (config.seedDB && config.seedDB.seed) {
				console.info(chalk.yellow('Warning:  Database seeding is turned on'));
				seed.start().then(() => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}

export default Application.getInstance();
