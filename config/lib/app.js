'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  mongoose = require('./mongoose'),
  express = require('./express'),
  chalk = require('chalk'),
  seed = require('./seed');

function seedDB() {
	return new Promise(resolve => {
		if (config.seedDB && config.seedDB.seed) {
			console.info(chalk.yellow('Warning:  Database seeding is turned on'));
			seed.start().then(() => {
				resolve()
			});
		  }
	});
}

module.exports.init = function init(callback) {
	let connection;
	let application;

	mongoose.connect()
	.then(conn => {
		connection = conn;
	})
	.then(mongoose.loadModels)
	.then(seedDB)
	.then(() => {
		application = express.init(connection);
	})
	.then(() => {
		if (callback) {
			callback(application, config);
		}
	})
};

module.exports.start = function start() {
  this.init(function (app, config) {

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
	  if (config.meanjs['meanjs-version'])
		console.log(chalk.green('MEAN.JS version: ' + config.meanjs['meanjs-version']));
	  console.log('--');
	});

  });

};
