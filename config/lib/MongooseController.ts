/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import _ from 'lodash';
import mongoose from 'mongoose';
import config from '../ApplicationConfig';

class MongooseController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: MongooseController;

	private constructor() {}

	public connect(): Promise<mongoose.Connection> {

		return new Promise(resolve => {

			mongoose.connection.on('error', (err) => {
				console.log(chalk.red(`An error occurred while communicating with ${config.db.uri}: ${err}`));
			});

			mongoose.connection.on('connecting', () => {
				console.log(chalk.yellow(`Attempting to connect to ${config.db.uri}...`));
			})

			mongoose.connection.on('connected', () => {
				console.log(chalk.green(`Connected successfully to ${config.db.uri}`));

				// resolve the promise with the new connection
				resolve(mongoose.connection);
			});

			mongoose.connection.on('disconnected', () => {
				console.log(chalk.yellow(`Disconnected from ${config.db.uri}`));

				// attempt to reconnect to database every 5 seconds
				setTimeout(() => {
					console.log('connect options: ', config.db.options);
					mongoose.connect(config.db.uri, config.db.options);
				}, 5000);
			})

			_.assign(config.db.options, { useNewUrlParser: true });
			mongoose.set('useFindAndModify', false);
			config.db.options.bufferCommands = false;
			config.db.options.bufferMaxEntries = 0;
			mongoose.connect(config.db.uri, config.db.options);
			// try {
			// 	setTimeout(() => {
			// 		console.log('config.db.options',config.db.options);
					
			// 	}, 5000);

			// } catch (error) {
			// 	console.log(chalk.red(`Unable to establish connection to ${config.db.ui}`));
			// }
		})
	}
}

export default MongooseController.getInstance();
