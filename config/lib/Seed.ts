/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import fs from 'fs';
import _ from 'lodash';
import mongoose from 'mongoose';
import UserModel from '../../modules/users/server/models/UserModel';
import config from '../ApplicationConfig';

class Seed {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: Seed;

	// global seed options object
	private seedOptions: any = {};

	private devexProd = config.devexProd === 'true';

	private constructor() {}

	public start = (options?) => {
		// Initialize the default seed options
		this.seedOptions = _.clone(config.seedDB.options);

		this.seedTestMessageTemplate();
		// Check for provided options

		if (_.has(options, 'logResults')) {
			this.seedOptions.logResults = options.logResults;
		}

		if (_.has(options, 'seedUser')) {
			this.seedOptions.seedUser = options.seedUser;
		}

		if (_.has(options, 'seedAdmin')) {
			this.seedOptions.seedAdmin = options.seedAdmin;
		}

		return new Promise((resolve, reject) => {
			const adminAccount = new UserModel(this.seedOptions.seedAdmin);
			const userAccount = new UserModel(this.seedOptions.seedUser);
			const devAccount = new UserModel({
				username: 'dev',
				provider: 'local',
				email: 'dev@localhost.com',
				firstName: 'Test',
				lastName: 'Developer',
				displayName: 'Test Developer',
				roles: ['user']
			});
			const devAccount2 = new UserModel({
				username: 'dev2',
				provider: 'local',
				email: 'dev2@localhost.com',
				firstName: 'Test 2',
				lastName: 'Developer 2',
				displayName: 'Test Developer 2',
				roles: ['user']
			});
			const govAccount = new UserModel({
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
				.then(() => {
					// If production, only seed admin using the ADMINPW environment parameter
					if (this.devexProd) {
						Promise.resolve()
							.then(() => {
								// do not allow an admin account to be created with the default password if we are in production
								const password = process.env.ADMINPW;
								if (!password) {
									throw new Error('Attempt to create Administrator account in production with default password: aborting.');
								}
								return password;
							})
							.then(this.seedTheUser(adminAccount))
							.then(() => {
								resolve();
							})
							.catch(this.reportError(reject));
					} else {
						// Add both Admin and User account
						Promise.resolve()
							//
							// dev account
							//
							.then(() => {
								return 'devdev';
							})
							.then(this.seedTheUser(devAccount2))
							.then(() => {
								return 'devdev';
							})
							.then(this.seedTheUser(devAccount))
							//
							// gov account
							//
							.then(() => {
								return 'govgov';
							})
							.then(this.seedTheUser(govAccount))
							//
							// admin account
							//
							.then(() => {
								const password = process.env.ADMINPW;
								return password || 'adminadmin';
							})
							.then(this.seedTheUser(adminAccount))
							//
							// general user account
							//
							.then(() => {
								return 'useruser';
							})
							.then(this.seedTheUser(userAccount))
							//
							// done
							//
							.then(() => {
								resolve();
							})
							.catch(this.reportError(reject));
					}
				})
				.catch(this.reportError(reject));
		});
	};

	private saveUser(user) {
		return () => {
			return new Promise((resolve, reject) => {
				// attempt to find existing user
				UserModel.find({ username: user.username }, (err, users) => {
					if (err) {
						console.error(err);
						reject(new Error('Error querying database for ' + user.username));
					} else {
						// if we found an existing user, update with password defined in environment parameters
						if (users.length > 0) {
							users[0].password = user.password;
							users[0].save({}, (userErr, savedUser) => {
								if (userErr) {
									console.error(userErr);
									reject(new Error('Failed to update existing user ' + savedUser.username));
								} else {
									resolve(savedUser);
								}
							});
						} else {
							user.save((userErr, newUser) => {
								if (userErr) {
									console.log(userErr);
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

	private reportSuccess(password) {
		return user => {
			return new Promise((resolve, reject) => {
				if (this.seedOptions.logResults) {
					console.log(chalk.yellow("Database Seeding:\tLocal user '" + user.username + "' has password set to '" + password + "'"));
				}
				resolve();
			});
		};
	}

	// save the specified user with the password provided from the resolved promise
	private seedTheUser(user) {
		return password => {
			return new Promise((resolve, reject) => {
				// set the new password
				user.password = password;

				Promise.resolve()
					.then(this.saveUser(user))
					.then(this.reportSuccess(password))
					.then(() => {
						resolve();
					})
					.catch(err => {
						resolve(err);
					});
			});
		};
	}

	private clearTemplates() {
		const T = mongoose.model('MessageTemplate');
		return new Promise((resolve, reject) => {
			T.deleteMany({}, err => {
				if (err) {
					console.error(err);
					console.error('Error removing templates');
					reject();
				}
				resolve();
			});
		});
	}

	private seedTestMessageTemplate() {
		console.log(chalk.yellow('Database seeding:\tSeeding message templates.'));
		const T = mongoose.model('MessageTemplate');
		const saveT = t => {
			return new Promise((resolve, reject) => {
				t.save(err => {
					if (err) {
						console.error(err);
						console.error('Error saving template');
					}
					resolve();
				});
			});
		};

		return this.clearTemplates().then(() => {
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
							'<p><strong>Congratulations!</strong></p><p>Your proposal to work on <strong><a href="{{ domain }}/{{opportunity.path}}">{{ opportunity.name }}</a></strong> has been selected! <strong>{{opportunity.assignor}}</strong> is offering the assignment to you.',
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
							'<p><strong>Congratulations!</strong></p><p>The team you put forward to work on <strong><a href="{{ domain }}/{{opportunity.path}}">{{ opportunity.name }}</a></strong> has been selected!</p>',
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/pre-approval-request.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/pre-approval-request.html'),
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
					}),
					new T({
						messageCd: 'opportunity-approval-request',
						messageLevel: 'request',
						description: 'Send an approval for publishing an opportunity',
						isSubscriptionType: false,
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-request.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-request.html'),
						emailSubjectTemplate: "BC Developer's Exchange - Opportunity Approval",
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
					}),
					new T({
						messageCd: 'opportunity-approved-notification',
						messageLevel: 'info',
						description: 'Send a notification that an approval request has been approved',
						isSubscriptionType: false,
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-approved.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-approved.html'),
						emailSubjectTemplate: "BC Developer's Exchange - Opportunity Approved",
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
					}),
					new T({
						messageCd: 'opportunity-denied-notification',
						messageLevel: 'info',
						description: 'Send a notification that an approval request has been denied',
						isSubscriptionType: false,
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-denied.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-denied.html'),
						emailSubjectTemplate: "BC Developer's Exchange - Opportunity Denied",
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
					}),
					new T({
						messageCd: 'opportunity-approval-2FA',
						messageLevel: 'info',
						description: 'Send a 2FA token for approval by email',
						isSubscriptionType: false,
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-2FA.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-2FA.html'),
						emailSubjectTemplate: "BC Developer's Exchange - 2FA Approval Token",
						modelsRequired: ['approvalInfo'],
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
	private reportError(reject) {
		return err => {
			if (this.seedOptions.logResults) {
				console.log();
				console.log('Database Seeding:\t' + err);
				console.log();
			}
		};
	}
}

export default Seed.getInstance();
