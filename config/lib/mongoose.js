'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  mongoose = require('mongoose');

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
	require(path.resolve(modelPath));
  });

  if (callback) callback();
};

// Initialize Mongoose
module.exports.connect = function (callback) {

  	mongoose.Promise = Promise;

	// set up mongodb event handlers
	mongoose.connection.on('disconnected', function() {
		console.log(chalk.yellow('Disconnected from ' + config.db.uri));
	});

	mongoose.connection.on('connecting', function() {
		console.log(chalk.yellow('Attempting to connect to ' + config.db.uri + '...'));
	});

	mongoose.connection.on('reconnected', function() {
		console.log(chalk.green('Reconnected to ' + config.db.uri));
	})

	mongoose.connection.once('connected', function() {
		mongoose.set('debug', config.db.debug);

		console.log(chalk.green('Connected successfully to ' + config.db.uri));
		if (callback) {
			callback(mongoose.connection);
		}
	});

	process.on('SIGINT', function() {
		mongoose.connection.close(function() {
			console.log(chalk.red('Closing connection to ' + config.db.uri));
			process.exit(0);
		})
	})

	var handleFailedConnect = function(err) {
		console.error(chalk.red('Could not connect to ' + config.db.uri + ' - is the database running?'));
		console.error(chalk.red(err));

		setTimeout(function() {
			mongoose.connect(config.db.uri, config.db.options).catch(handleFailedConnect);
		}, 3000);
	}

	mongoose.connect(config.db.uri, config.db.options).catch(handleFailedConnect);
};

module.exports.disconnect = function (cb) {
  mongoose.disconnect(function (err) {
	console.info(chalk.yellow('Disconnected from MongoDB.'));
	cb(err);
  });
};
