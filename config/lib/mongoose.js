'use strict';

/**
 * Module dependencies.
 */
var config 		= require('../config'),
  	chalk 		= require('chalk'),
	path 		= require('path'),
	_			= require('lodash'),
  	mongoose 	= require('mongoose');

// Load the mongoose models
module.exports.loadModels = () => {
	// Globbing model files
	config.files.server.models.forEach((modelPath) => {
		require(path.resolve(modelPath));
	});
};

// Initialize Mongoose
module.exports.connect = () => {

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
		})

		process.on('SIGINT', () => {
			mongoose.connection.close(() => {
				console.log(chalk.red('Closing connection to ' + config.db.uri));
				process.exit(0);
			})
		})

		var handleSuccessConnect = () => {
			mongoose.set('debug', config.db.debug);
			console.log(chalk.green('Connected successfully to ' + config.db.uri));
			resolve(mongoose.connection);
		}

		var handleFailedConnect = err => {
			console.error(chalk.red('Could not connect to ' + config.db.uri + ' - is the database running?'));
			console.error(chalk.red(err));

			setTimeout(() => {
				mongoose.connect(config.db.uri, config.db.options)
				.then(handleSuccessConnect)
				.catch(handleFailedConnect);
			}, 3000);
		}

		_.assign(config.db.options, { useNewUrlParser: true });
		mongoose.connect(config.db.uri, config.db.options)
		.then(handleSuccessConnect)
		.catch(handleFailedConnect);
	});
};

module.exports.disconnect = callback => {
  mongoose.disconnect(err => {
	console.info(chalk.yellow('Disconnected from MongoDB.'));
	callback(err);
  });
};
