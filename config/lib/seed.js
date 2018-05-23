'use strict';

var _ = require('lodash'),
	config = require('../config'),
	mongoose = require('mongoose'),
	path = require('path'),
	chalk = require('chalk'),
	crypto = require('crypto');

// global seed options object
var seedOptions = {};

var isProduction  = config.feature_hide;
var isDevelopment = !isProduction;

function removeUser (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }).remove(function (err) {
			if (err) {
				reject(new Error('Failed to remove local ' + user.username));
			}
			resolve();
		});
	});
}

function saveUser (user) {
	return function() {
		return new Promise(function (resolve, reject) {
			// Then save the user
			user.save(function (err, theuser) {
				if (err) {
					console.log (err);
					reject(new Error('Failed to add local ' + user.username));
				} else {
					resolve(theuser);
				}
			});
		});
	};
}

function checkUserNotExists (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }, function (err, users) {
			if (err) {
				reject(new Error('Failed to find local account ' + user.username));
			}

			if (users.length === 0) {
				resolve();
			} else {
				// console.log('Database Seeding:\t\t\t' + 'local account already exists: ' + user.username);
				// resolve ();
				reject(new Error('Failed due to local account already exists: ' + user.username));
			}
		});
	});
}

function reportSuccess (password) {
	return function (user) {
		return new Promise(function (resolve, reject) {
			if (seedOptions.logResults) {
				console.log(chalk.bold.red('Database Seeding:\t\t\tLocal ' + user.username + ' added with password set to ' + password));
			}
			resolve();
		});
	};
}

// save the specified user with the password provided from the resolved promise
function seedTheUser (user) {
	return function (password) {
		return new Promise(function (resolve, reject) {

			var User = mongoose.model('User');
			// set the new password
			user.password = password;

			if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					.catch(function (err) {
						reject(err);
					});
			} else {
				// removeUser(user)
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					// .catch(function (err) {
					//   // resolve();
					//   reject(err);
					// });
					;
			}
		});
	};
}

function seedTestMessageTemplate () {
	var T = mongoose.model ('MessageTemplate');
	var saveT = function (t) {
		return new Promise (function (resolve, reject) {
			t.save (function (err) {
				resolve ();
			});
		});
	};
	return Promise.all ([
	    new T ({
			messageCd            : 'add-user-to-company-request',
			description          : 'Ask the user whether they agree to be added to this company' ,
			isSubscriptionType   : false,
			messageBodyTemplate  : '<p>Hi {{user.name}}</p><br/>Whazzup about company {{org.name}}?',
			messageShortTemplate : 'company {{org.name}} wants you dude!',
			messageTitleTemplate : 'company {{org.name}}?',
			emailBodyTemplate    : '<p>Hi {{user.name}}</p><br/>Whazzup about company {{org.name}}?',
			emailSubjectTemplate : 'company {{org.name}}',
			modelsRequired       : ['org'],
			daysToArchive        : 7,
			actions              : [{
				actionCd      : 'decline',
				linkTitleTemplate : 'Decline',
				isDefault     : true
			},{
				actionCd      : 'accept',
				linkTitleTemplate : 'Accept',
				linkTemplate  : '{{domain}}/accept/{{org._id}}'
			}]
		}),
		new T ({
			messageCd            : 'invitation-from-company',
			description          : 'Does the user want to sign up to devex, invited by company' ,
			isSubscriptionType   : false,
			messageBodyTemplate  : '<p>Hi there</p><br/>Company {{org.name}} is inviting you to sign up to the <a href="{{domain}}">developer\'s exchange</a></p>',
			messageShortTemplate : 'company {{org.name}} wants you join devex',
			messageTitleTemplate : 'company {{org.name}} wants you join devex',
			emailBodyTemplate    : '<p>Hi there</p><br/>Company {{org.name}} is inviting you to sign up to the <a href="{{domain}}">developer\'s exchange</a></p>',
			emailSubjectTemplate : 'company {{org.name}} wants you join devex',
			modelsRequired       : ['org'],
			daysToArchive        : 7,
			actions              : [{
				actionCd      : 'decline',
				linkTitleTemplate : 'Decline',
				isDefault     : true
			},{
				actionCd      : 'accept',
				linkTitleTemplate : 'Accept',
				linkTemplate  : '{{domain}}/accept/{{org._id}}'
			}]
		}),
		new T ({
			messageCd            : 'invitation-to-devex',
			description          : 'Ask person to sign up to devex' ,
			isSubscriptionType   : false,
			messageBodyTemplate  : '<p>Hi there</p><br/>Sign up to the <a href="{{domain}}">developer\'s exchange</a></p>',
			messageShortTemplate : 'we wants you dude!',
			messageTitleTemplate : 'we?',
			emailBodyTemplate    : 'we wants you dude!',
			emailSubjectTemplate : 'we',
			modelsRequired       : ['org'],
			daysToArchive        : 7,
			actions              : [{
				actionCd      : 'decline',
				linkTitleTemplate : 'Decline',
				isDefault     : true
			},{
				actionCd      : 'accept',
				linkTitleTemplate : 'Accept',
				linkTemplate  : '{{domain}}/accept/{{org._id}}'
			}]
		})
	]);
};

//
// Seed the default notifications for each object type in the system
//
function seedNotifications () {
	var Notification = mongoose.model ('Notification');
	//
	// we make notifications for add / delete for Users, Opportunities, Programs, and Projects
	//
	var objects = ['User', 'Program', 'Project', 'Opportunity'];
	var events = ['Add', 'Delete', 'UpdateAny'];
	var prefix = 'not';
	var codes = [];
	objects.forEach (function (obj) {
		var lobj = obj.toLowerCase();
		events.forEach (function (evt) {
			var levt = evt.toLowerCase();
			codes.push ({
				code     : [prefix, levt, lobj].join('-'),
				name     : evt+' '+obj,
				// question : 'Notify me of object: ['+obj+'] event: ['+evt+']',
				target   : obj,
				// subject  : 'subject default',
				// body     : 'body default',
				event    : evt
			});
		});
	});
	// console.log (codes);
	return Promise.all (codes.map (function (code) {
		var notification = new Notification ({
			code        : code.code,
			name        : code.name,
			// description : code.name,
			// question    : code.question,
			target      : code.target,
			event       : code.event
			// subject     : code.subject,
			// body        : code.body
		});
		return new Promise (function (resolve, reject) {
			Notification.find ({code:code.code}, function (err, result) {
				if (err || result.length > 0) resolve ();
				else {
					notification.save (function (err, m) {
						// if (err) console.error (err);
						resolve (m);
					});
				}
			});
		});
	}));
}

// report the error
function reportError (reject) {
	return function (err) {
		if (seedOptions.logResults) {
			console.log();
			console.log('Database Seeding:\t\t\t' + err);
			console.log();
		}
		reject(err);
	};
}

module.exports.start = function start(options) {
	// Initialize the default seed options
	seedOptions = _.clone(config.seedDB.options, true);

	seedTestMessageTemplate ();
	// Check for provided options

	if (_.has(options, 'logResults')) {
		seedOptions.logResults = options.logResults;
	}

	if (_.has(options, 'seedUser')) {
		seedOptions.seedUser = options.seedUser;
	}

	if (_.has(options, 'seedAdmin')) {
		seedOptions.seedAdmin = options.seedAdmin;
	}

	var User = mongoose.model('User');
	return new Promise(function (resolve, reject) {

		var adminAccount = new User(seedOptions.seedAdmin);
		var userAccount = new User(seedOptions.seedUser);
		var devAccount = new User ({
			username: 'dev',
			provider: 'local',
			email: 'dev@localhost.com',
			firstName: 'Test',
			lastName: 'Developer',
			displayName: 'Test Developer',
			roles: ['user']
		});
		var devAccount2 = new User ({
			username: 'dev2',
			provider: 'local',
			email: 'dev2@localhost.com',
			firstName: 'Test 2',
			lastName: 'Developer 2',
			displayName: 'Test Developer 2',
			roles: ['user']
		});
		var govAccount = new User ({
			username: 'gov',
			provider: 'local',
			email: 'gov@localhost.com',
			firstName: 'Test',
			lastName: 'Government',
			displayName: 'Test Government',
			roles: ['user', 'gov']
		});
		Promise.resolve ()
		.then (seedNotifications)
		.then (function () {
			// If production only seed admin if it does not exist
			if (isProduction) {
				User.generateRandomPassphrase()
					.then(function (random) {
						var passed = process.env.ADMINPW;
						return passed || 'adminadmin';
					})
					.then(seedTheUser(adminAccount))
					.then(function () {
						resolve();
					})
					.catch(reportError(reject));
			} else {
				// Add both Admin and User account
				Promise.resolve ()
				//
				// dev account
				//
				.then(function () { return 'devdev'; })
				.then(seedTheUser(devAccount2))
				.then(function () { return 'devdev'; })
				.then(seedTheUser(devAccount))
				//
				// gov account
				//
				.then(function () { return 'govgov'; })
				.then(seedTheUser(govAccount))
				//
				// admin account
				//
				.then (User.generateRandomPassphrase())
				.then(function (random) {
					var passed = process.env.ADMINPW;
					console.log (passed);
					return passed || 'adminadmin';
				})
				.then(seedTheUser(adminAccount))
				//
				// general user account
				//
				.then(function () { return 'useruser'; })
				.then(seedTheUser(userAccount))
				//
				// done
				//
				.then(function () {
					resolve();
				})
				.catch(reportError(reject));
			}

		})
		.catch (reportError(reject));

	});
};
