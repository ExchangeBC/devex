/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import { Express } from 'express';
import * as config from '../config';
import { ExpressApplication } from './express';
import * as mongoose from './mongoose';
import * as seed from './seed';

export class Application {
	private express = new ExpressApplication();

	public init = (): Promise<Express> => {
		// tslint:disable:no-console
		console.log('APP INIT');
		return new Promise(resolve => {
			let connection;
			Promise.resolve()
				.then(mongoose.connect)
				.then(conn => {
					connection = conn;
				})
				.then(mongoose.loadModels)
				.then(this.seedDB)
				.then(() => {
					resolve(this.express.init(connection));
				});
		});
	};

	public start = () => {
		// tslint:disable
		console.log('starting app');
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
