'use strict';

var path = require('path'),
	chalk = require('chalk'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');


var findUserByUsername = function (username, callback) {
	if (process.env.NODE_ENV !== 'production') {
		User.findOne({
			username: username.toLowerCase()
		}).populate('org').exec(function (error, user) {
			if (error) {
				return callback(new Error(error), null);
			} else if (!user) {
				return callback(new Error('User not found for "' + username + '".'), null);
			} else {
				return callback(null, user);
			}
		});
	} else {
		return callback(new Error('Not allowed in Production'), null);
	}
};

exports.renderAsIndex = function (req, res) {

	// if not in production, allow us login as a user
	if (process.env.NODE_ENV !== 'production') {
		var username = req.params.username;
		req.logout();

		findUserByUsername(username, function(error, user) {
			if (error) {
				console.error(chalk.red('Error: findUserByUsername(' + username + '): ' + error.message));
				res.redirect('/');
			} else {
				if (user) {
					req.login(user, function (err) {
						if (err) {
							// redirect to base, no user...
							console.error(chalk.red('Error: findUserByUsername.login(' + username + '): ' + err.message));
							res.redirect('/');
						} else {
							// redirect to base, but we'll have a user logged in...
							res.redirect('/');
						}
					});
				} else {
					console.error(chalk.red('Error: findUserByUsername(' + username + '): user not populated/loaded.'));
					res.redirect('/');
				}
			}
		});
	} else {
		// we don't do any user lookups/logins through this route in PROD.
		res.redirect('/', 302);
	}
};
