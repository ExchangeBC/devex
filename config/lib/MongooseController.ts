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

	// Initialize Mongoose
	public connect = () => {
		return new Promise(resolve => {
			mongoose.Promise = Promise;

			// set up mongodb event handlers
			mongoose.connection.on('disconnected', () => {
				console.log(chalk.yellow('Disconnected from ' + config.db.uri));
			});

			mongoose.connection.on('connecting', () => {
				console.log(chalk.yellow('Attempting to connect to ' + config.db.uri + '...'));
			});

			mongoose.connection.on('reconnected', () => {
				console.log(chalk.green('Reconnected to ' + config.db.uri));
			});

			mongoose.set('useFindAndModify', false);

			process.on('SIGINT', () => {
				mongoose.connection.close(() => {
					console.log(chalk.red('Closing connection to ' + config.db.uri));
					process.exit(0);
				});
			});

			const handleSuccessConnect = () => {
				mongoose.set('debug', config.db.debug);
				console.log(chalk.green('Connected successfully to ' + config.db.uri));
				resolve(mongoose.connection);
			};

			const handleFailedConnect = err => {
				console.error(chalk.red('Could not connect to ' + config.db.uri + ' - is the database running?'));
				console.error(chalk.red(err));

				setTimeout(() => {
					return new Promise(this.handleConnect).then(handleSuccessConnect).catch(handleFailedConnect);
				}, 3000);
			};

			_.assign(config.db.options, { useNewUrlParser: true });
			return new Promise(this.handleConnect).then(handleSuccessConnect).catch(handleFailedConnect);
		});
	};

	public disconnect = callback => {
		mongoose.disconnect(err => {
			console.info(chalk.yellow('Disconnected from MongoDB.'));
			callback(err);
		});
	};

	private handleConnect = (resolve, reject) => {
		if (
			mongoose.connect(
				config.db.uri,
				config.db.options
			)
		) {
			resolve();
		} else {
			reject();
		}
	};
}

export default MongooseController.getInstance();
