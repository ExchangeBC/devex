'use strict';

var _ = require('lodash'),
	config = require('../config'),
	mongoose = require('mongoose'),
	chalk = require('chalk'),
	fs = require('fs');

// global seed options object
var seedOptions = {};

var devexProd = config.devexProd === 'true';

function saveUser(user) {
	return function() {
		return new Promise(function(resolve, reject) {
			var User = mongoose.model('User');

			// attempt to find existing user
			User.find({ username: user.username, email: user.email }, function(err, users) {
				if (err) {
					console.error(err);
					reject(new Error('Error querying database for ' + user.username));
				} else {
					// if we found an existing user, update with password defined in environment parameters
					if (users.length > 0) {
						users[0].password = user.password;
						users[0].save(users[0], function(err, user) {
							if (err) {
								console.error(err);
								reject(new Error('Failed to update existing user ' + user.username));
							} else {
								resolve(user);
							}
						});
					}
					// if we didn't find an existing user, create the new user
					else {
						user.save(function(err, newUser) {
							if (err) {
								console.log(err);
								reject(new Error('Failed to add local ' + user.username));
							} else {
								resolve(newUser);
							}
						});
					}
				}
			});
		});
	};
}

function reportSuccess(password) {
	return function(user) {
		return new Promise(function(resolve, reject) {
			if (seedOptions.logResults) {
				console.log(chalk.yellow("Database Seeding:\tLocal user '" + user.username + "' has password set to '" + password + "'"));
			}
			resolve();
		});
	};
}

// save the specified user with the password provided from the resolved promise
function seedTheUser(user) {
	return function(password) {
		return new Promise(function(resolve, reject) {
			// set the new password
			user.password = password;

			Promise.resolve()
				.then(saveUser(user))
				.then(reportSuccess(password))
				.then(function() {
					resolve();
				})
				.catch(function(err) {
					resolve(err);
				});
		});
	};
}

function clearTemplates() {
	var T = mongoose.model('MessageTemplate');
	return new Promise(function(resolve, reject) {
		T.remove({}, function(err) {
			if (err) {
				console.error(err);
				console.error('Error removing templates');
				reject();
			}
			resolve();
		});
	});
}

function seedTestMessageTemplate() {
	console.log(chalk.yellow('Database seeding:\tSeeding message templates.'));
	var T = mongoose.model('MessageTemplate');
	var saveT = function(t) {
		return new Promise(function(resolve, reject) {
			t.save(function(err) {
				if (err) {
					console.error(err);
					console.error('Error saving template');
				}
				resolve();
			});
		});
	};
	return clearTemplates().then(function() {
		return Promise.all(
			[
				new T({
					messageCd: 'add-user-to-company-request',
					messageLevel: 'request',
					description: 'Notify a user they have been invited to join a company',
					isSubscriptionType: false,
					messageBodyTemplate:
						'<p>You have been invited to join <strong>{{org.name}}</strong>.</p><p>If you accept, {{org.name}} will be able to put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>',
					messageShortTemplate: '',
					messageTitleTemplate: "You've been invited to join {{org.name}}",
					emailBodyTemplate:
						"<p>Hi {{user.firstName}},</p><p>You've been invited to join <strong>{{org.name}}</strong>. If you accept, {{org.name}} will be able to put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>",
					emailSubjectTemplate: "You've been invited to join {{org.name}}",
					modelsRequired: ['org'],
					daysToArchive: 7,
					linkTemplate: '/join/org/{{org._id}}',
					actions: [
						{
							actionCd: 'decline',
							linkTitleTemplate: 'Decline',
							isDefault: true
						},
						{
							actionCd: 'accept',
							linkTitleTemplate: 'Accept'
						}
					]
				}),
				new T({
					messageCd: 'invitation-from-company',
					messageLevel: 'request',
					description: 'Invite a user to sign up, because they have been invited by company',
					isSubscriptionType: false,
					messageBodyTemplate:
						"<p>You've been invited to join <strong>{{org.name}}</strong>.</p><p>If you accept, {{org.name}} will be able to put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>",
					messageShortTemplate: '',
					messageTitleTemplate: "You've been invited to join {{org.name}}",
					emailBodyTemplate: "<p>Hi {{user.firstName}}</p><p>You've been invited to sign up on the BCDevExchange and to join <strong>{{org.name}}</strong>.</p>",
					emailSubjectTemplate: 'Sign up and join {{org.name}}',
					modelsRequired: ['org'],
					daysToArchive: 7,
					linkTemplate: '/join/org/{{org._id}}',
					actions: [
						{
							actionCd: 'decline',
							linkTitleTemplate: 'Decline',
							isDefault: true
						},
						{
							actionCd: 'accept',
							linkTitleTemplate: 'Accept'
						}
					]
				}),
				new T({
					messageCd: 'opportunity-update',
					messageLevel: 'info',
					description: 'notify the user that there were updates to an opportunity they are watching',
					isSubscriptionType: true,
					messageBodyTemplate: '<p>An opportunity you are watching has just been updated:</p><h4><a href="{{ domain }}/{{opportunity.path}}">{{opportunity.name}}</a></h4>',
					messageShortTemplate: '',
					messageTitleTemplate: "An opportunity you're watching has been updated",
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> Hi {{user.displayName}}, <br/><br/> An opportunity you followed has been updated: <h4>{{ opportunity.name }}</h4> <h4><a href="{{ domain }}/{{ opportunity.path }}">See the details</a></h4> --- <i>To stop receiving notifications about this opportunity, <a href="{{ domain }}/{{ opportunity.path }}">browse to the opportunity</a> and un-watch it</i>',
					emailSubjectTemplate: 'Opportunity {{ opportunity.name }} has been updated',
					modelsRequired: ['opportunity'],
					daysToArchive: 1,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'Dismiss',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'opportunity-add-cwu',
					messageLevel: 'info',
					description: 'notify the user that there is a new opportunity',
					isSubscriptionType: true,
					messageBodyTemplate: '<p>A new <i>Code With Us</i> opportunity has just been posted:</p><h4><a href="{{opportunity.path}}">{{opportunity.name}}</a></h4>',
					messageShortTemplate: '',
					messageTitleTemplate: 'A new opportunity has just been posted!',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> <p>Hi {{user.displayName}},</p> <p>A new opportunity has just been posted:</p> <h4>{{ opportunity.name }}</h4> <ul><li>Value: <b>{{ formattedEarnings }}</b> CAD</li><li>Deadline to apply: <b>16:00 Pacific Time</b> on <b>{{ opportunity.deadline_format_date }}</b></li></ul><h4><a href="{{ domain }}/{{ opportunity.path }}">Click here to see the details</a></h4> <p>Have a great day!<br/><b>The BCDevExchange Team</b></p> <br><br> <p><i>To stop receiving notifications about new opportunities, <a href="{{ domain }}/opportunities">browse to the opportunity list</a> and stop listening, or visit <a href="{{ domain }}/settings/privacy">your profile</a> and uncheck "Tell me about new opportunities" </i></p>',
					emailSubjectTemplate: 'A new opportunity has just been posted!',
					modelsRequired: ['opportunity'],
					daysToArchive: 1,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'Dismiss',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'opportunity-add-swu',
					messageLevel: 'info',
					description: 'notify the user that there is a new opportunity',
					isSubscriptionType: true,
					messageBodyTemplate: '<p>A new <i>Sprint With Us</i> opportunity has just been posted:</p><h4><a href="{{opportunity.path}}">{{opportunity.name}}</a></h4>',
					messageShortTemplate: '',
					messageTitleTemplate: 'A new opportunity has just been posted!',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> <p>Hi {{user.displayName}},</p> <p>A new opportunity has just been posted:</p> <h4>{{ opportunity.name }}</h4> <ul><li>Value: <b>{{ formattedBudget }}</b> CAD</li><li>Deadline to apply: <b>16:00 Pacific Time</b> on <b>{{ opportunity.deadline_format_date }}</b></li></ul><h4><a href="{{ domain }}/{{ opportunity.path }}">Click here to see the details</a></h4> <p>Have a great day!<br/><b>The BCDevExchange Team</b></p> <br><br> <p><i>To stop receiving notifications about new opportunities, <a href="{{ domain }}/opportunities">browse to the opportunity list</a> and stop listening, or visit <a href="{{ domain }}/settings/privacy">your profile</a> and uncheck "Tell me about new opportunities" </i></p>',
					emailSubjectTemplate: 'A new opportunity has just been posted!',
					modelsRequired: ['opportunity'],
					daysToArchive: 1,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'Dismiss',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'opportunity-assign-cwu',
					messageLevel: 'info',
					description: 'notify the user that they have been assigned the opportunity',
					isSubscriptionType: true,
					messageBodyTemplate:
						'<p>🎉 <strong>Congratulations!</strong> 🎉</p><p>Your proposal to work on <strong><a href="{{ domain }}/{{opportunity.path}}">{{ opportunity.name }}</a></strong> has been selected! <strong>{{opportunity.assignor}}</strong> is offering the assignment to you.',
					messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
					messageTitleTemplate: 'Your Proposal has been selected!',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> <p>Your proposal to work on <strong>{{ opportunity.name }}</strong> has been selected! <strong>{{opportunity.assignor}}</strong> is offering the assignment to you.</p>',
					emailSubjectTemplate: 'Your Proposal has been selected!',
					modelsRequired: ['opportunity'],
					daysToArchive: 1,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'OK',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'opportunity-assign-swu',
					messageLevel: 'info',
					description: 'notify the user that they have been assigned the opportunity',
					isSubscriptionType: true,
					messageBodyTemplate:
						'<p>🎉 <strong>Congratulations!</strong> 🎉</p><p>The team you put forward to work on <strong><a href="{{ domain }}/{{opportunity.path}}">{{ opportunity.name }}</a></strong> has been selected!</p>',
					messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
					messageTitleTemplate: 'Your Proposal has been selected!',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> The Proposal you submitted to work on, {{ opportunity.name }}, has been selected! {{opportunity.assignor}} is offering the assignment to you.',
					emailSubjectTemplate: 'Your Proposal has been selected!',
					modelsRequired: ['opportunity'],
					daysToArchive: 1,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'OK',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'gov-member-request',
					messageLevel: 'request',
					description: 'Notify the devex administrator account of a new government membership request',
					isSubscriptionType: false,
					messageBodyTemplate:
						'<p><strong>{{ requestingUser.firstName }} {{ requestingUser.lastName }}</strong> has requested goverment access</p><p>Approving the request will give {{ requestingUser.firstName }} permission to create and evaluate new opportunities.</p>',
					messageShortTemplate: '',
					messageTitleTemplate: '',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> <p>Hi Admin,</p> <p><strong>{{requestingUser.firstName}} {{requestingUser.lastName}}</strong> has requested government access to the BC Developer\'s Exchange.  Click <a href="{{ domain }}/settings/messages">here</a> to authorize or decline their request.</p>',
					emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
					modelsRequired: ['user'],
					daysToArchive: 0,
					linkTemplate: '/gov/add/{{ requestingUser._id }}',
					actions: [
						{
							actionCd: 'approve',
							linkTitleTemplate: 'Approve'
						},
						{
							actionCd: 'decline',
							linkTitleTemplate: 'Decline',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'gov-request-declined',
					messageLevel: 'info',
					description: 'Notify a user requesting government access that their request has been declined',
					isSubscriptionType: false,
					messageBodyTemplate:
						'<p>Your request for public sector verification has been denied.  If you feel this is in error, please send email to <a href="mailto:bcdevexchange@gov.bc.ca">bcdevexchange@gov.bc.ca</a>',
					messageShortTemplate: '',
					messageTitleTemplate: '',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> <p>Hi {{ requestingUser.firstName }},</p><p>Your request for public sector verification has been denied.  If you feel this is in error, please send email to <a href="mailto:bcdevexchange@gov.bc.ca">bcdevexchange@gov.bc.ca</a></p>',
					emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
					modelsRequired: ['user'],
					daysToArchive: 0,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'OK',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'gov-request-approved',
					messageLevel: 'info',
					description: 'Notify a user requesting government access that their request has been approved',
					isSubscriptionType: false,
					messageBodyTemplate:
						'<p>Your request for public sector verification has been approved!  You are now able to <a href="{{ domain }}/opportunityadmin/createlanding">post</a> Code With Us and Sprint With Us opportunities!',
					messageShortTemplate: '',
					messageTitleTemplate: '',
					emailBodyTemplate:
						'<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> <p>Hi {{ requestingUser.firstName }},</p><p>Your request for public sector verification has been approved!  You are now able to <a href="{{ domain }}/opportunityadmin/createlanding">post<a/> Code With Us and Sprint With Us opportunities!</p>',
					emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
					modelsRequired: ['user'],
					daysToArchive: 0,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'OK',
							isDefault: true
						}
					]
				}),
				new T({
					messageCd: 'opportunity-pre-approval-request',
					messageLevel: 'request',
					description: 'Send a pre-approval for publishing an opportunity',
					isSubscriptionType: false,
					messageBodyTemplate: fs.readFileSync('config/message-templates/pre-approval-request.html'),
					messageShortTemplate: '',
					messageTitleTemplate: '',
					emailBodyTemplate: fs.readFileSync('config/message-templates/pre-approval-request.html'),
					emailSubjectTemplate: "BC Developer's Exchange - Opportunity Pre-Approval",
					modelsRequired: ['opportunity'],
					daysToArchive: 0,
					linkTemplate: '/defaultonly',
					actions: [
						{
							actionCd: 'ok',
							linkTitleTemplate: 'OK',
							isDefault: true
						}
					]
				})
			].map(saveT)
		);
	});
}

// report the error
function reportError(reject) {
	return function(err) {
		if (seedOptions.logResults) {
			console.log();
			console.log('Database Seeding:\t' + err);
			console.log();
		}
	};
}

module.exports.start = function start(options) {
	// Initialize the default seed options
	seedOptions = _.clone(config.seedDB.options, true);

	seedTestMessageTemplate();
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
	return new Promise(function(resolve, reject) {
		var adminAccount = new User(seedOptions.seedAdmin);
		var userAccount = new User(seedOptions.seedUser);
		var devAccount = new User({
			username: 'dev',
			provider: 'local',
			email: 'dev@localhost.com',
			firstName: 'Test',
			lastName: 'Developer',
			displayName: 'Test Developer',
			roles: ['user']
		});
		var devAccount2 = new User({
			username: 'dev2',
			provider: 'local',
			email: 'dev2@localhost.com',
			firstName: 'Test 2',
			lastName: 'Developer 2',
			displayName: 'Test Developer 2',
			roles: ['user']
		});
		var govAccount = new User({
			username: 'gov',
			provider: 'local',
			email: 'gov@localhost.com',
			firstName: 'Test',
			lastName: 'Government',
			displayName: 'Test Government',
			roles: ['user', 'gov']
		});

		Promise.resolve()
			// .then (seedNotifications)
			.then(function() {
				// If production, only seed admin using the ADMINPW environment parameter
				if (devexProd) {
					Promise.resolve()
						.then(function() {
							// do not allow an admin account to be created with the default password if we are in production
							var password = process.env.ADMINPW;
							if (!password) {
								throw new Error('Attempt to create Administrator account in production with default password: aborting.');
							}
							return password;
						})
						.then(seedTheUser(adminAccount))
						.then(function() {
							resolve();
						})
						.catch(reportError(reject));
				} else {
					// Add both Admin and User account
					Promise.resolve()
						//
						// dev account
						//
						.then(function() {
							return 'devdev';
						})
						.then(seedTheUser(devAccount2))
						.then(function() {
							return 'devdev';
						})
						.then(seedTheUser(devAccount))
						//
						// gov account
						//
						.then(function() {
							return 'govgov';
						})
						.then(seedTheUser(govAccount))
						//
						// admin account
						//
						.then(function() {
							var password = process.env.ADMINPW;
							return password || 'adminadmin';
						})
						.then(seedTheUser(adminAccount))
						//
						// general user account
						//
						.then(function() {
							return 'useruser';
						})
						.then(seedTheUser(userAccount))
						//
						// done
						//
						.then(function() {
							resolve();
						})
						.catch(reportError(reject));
				}
			})
			.catch(reportError(reject));
	});
};
