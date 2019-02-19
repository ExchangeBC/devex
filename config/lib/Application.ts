/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import express from 'express';
import config from '../ApplicationConfig';
import ExpressApplication from './ExpressApplication';
import MongooseController from './MongooseController';
import seed from './Seed';

class Application {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: Application;

	private constructor() {
		this.init = this.init.bind(this);
		this.start = this.start.bind(this);
	}

	public async start(): Promise<void> {
		// Initialize the application
		const app = await this.init();

		// Start the app by listening on <port> at <host>
		app.listen(config.port, config.host, () => {
			// Create server URL
			const server = (config.secure && config.secure.ssl ? 'https://' : 'http://') + config.host + ':' + config.port;

			// Logging initialization
			console.log('--');
			console.log(chalk.green(config.app.title));
			console.log();
			console.log(chalk.green(`Environment:     ${process.env.NODE_ENV}`));
			console.log(chalk.green(`Server:          ${server}`));
			console.log(chalk.green(`Database:        ${config.db.uri}`));
			console.log(chalk.green(`App version:     ${config.pkg.version}`));
			console.log('--');
		});
	}

	private async init(): Promise<express.Application> {
		const connection = await MongooseController.connect();
		await this.seedDB();
		return ExpressApplication.init(connection);
	}

	private async seedDB(): Promise<void> {
		if (config.seedDB && config.seedDB.seed) {
			console.info(chalk.yellow('Warning: Database seeding is turned on '));
			await seed.start();
		}
		return;
	}
}

export default Application.getInstance();
