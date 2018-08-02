'use strict';

/**
 * Module dependencies.
 */
var config 		= require('../config'),
  	mongoose 	= require('./mongoose'),
  	express 	= require('./express'),
  	chalk 		= require('chalk'),
  	seed 		= require('./seed');

function seedDB() {
	return new Promise(resolve => {
		if (config.seedDB && config.seedDB.seed) {
			console.info(chalk.yellow('Warning:  Database seeding is turned on'));
			seed.start().then(() => {
				resolve()
			});
		}
		else {
			resolve();
		}
	});
}

module.exports.init = () => {
	return new Promise(resolve => {
		let connection;

		Promise.resolve()
		.then(mongoose.connect)
		.then(conn => {
			connection = conn;
		})
		.then(mongoose.loadModels)
		.then(seedDB)
		.then(() => {
			resolve(express.init(connection));
		});
	});
};

module.exports.start = () => {
	this.init().then(app => {
		// Start the app by listening on <port> at <host>
		app.listen(config.port, config.host, function () {
			// Create server URL
			var server = ((config.secure && config.secure.ssl) ? 'https://' : 'http://') + config.host + ':' + config.port;
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
