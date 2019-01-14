/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import fs from 'fs';
import _ from 'lodash';
import mongoose from 'mongoose';
import { UserModel } from '../../modules/users/server/models/UserModel';
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/orgs/add-user-to-company-request-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: "You've been invited to join {{org.name}}",
						emailBodyTemplate: fs.readFileSync('config/email-templates/orgs/add-user-to-company-request-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/orgs/invitation-from-company-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: "You've been invited to join {{org.name}}",
						emailBodyTemplate: fs.readFileSync('config/email-templates/orgs/invitation-from-company-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-update-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: "An opportunity you're watching has been updated",
						emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-update-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-add-cwu-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: 'A new opportunity has just been posted!',
						emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-add-cwu-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-add-swu-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: 'A new opportunity has just been posted!',
						emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-add-swu-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-assign-cwu-msg.html'),
						messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
						messageTitleTemplate: 'Your Proposal has been selected!',
						emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-assign-cwu-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-assign-swu-msg.html'),
						messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
						messageTitleTemplate: 'Your Proposal has been selected!',
						emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-assign-swu-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-member-request-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-member-request-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-request-declined-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-request-declined-email.html'),
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
						messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-request-approved-msg.html'),
						messageShortTemplate: '',
						messageTitleTemplate: '',
						emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-request-approved-email.html'),
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
						messageBodyTemplate: '',
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
						messageBodyTemplate: '',
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
						messageBodyTemplate: '',
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
