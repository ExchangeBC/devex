'use strict';

import * as mongoose from 'mongoose';
import * as passport from 'passport';
import { CoreErrors } from '../../../../core/server/controllers/errors.server.controller';
import { MessagesController } from '../../../../messages/server/controllers/messages.controller';
import { User } from '../../models/user.server.model';

export class UserAuthenticationController {
	private messagesController = new MessagesController();
	private claimMessages = this.messagesController.claimMessages;
	private sendMessages = this.messagesController.sendMessages;
	private errorHandler = new CoreErrors();

	// URLs for which user can't be redirected on signin
	private noReturnUrls = ['/authentication/signin', '/authentication/signup'];

	public signup = (req, res) => {
		// For security measurement we remove the roles from the req.body object
		delete req.body.roles;

		// Init user and add missing fields
		const user = new User(req.body);
		user.provider = 'local';
		user.displayName = user.firstName + ' ' + user.lastName;
		if (user.government) {
			user.roles = ['gov-request', 'user'];
		}

		// Then save the user
		user.save(err => {
			if (err) {
				return res.status(422).send({
					message: this.errorHandler.getErrorMessage(err)
				});
			} else {
				// Remove sensitive data before login
				user.password = undefined;
				user.salt = undefined;
				//
				// CC: this bit claims any messages attributed to this new
				// user's email address
				//
				this.claimMessages(user);
				req.login(user, loginErr => {
					if (loginErr) {
						res.status(400).send(loginErr);
					} else {
						res.json(user);
					}
				});
			}
		});
	};

	/**
	 * Signin after passport authentication
	 */
	public signin = (req, res, next) => {
		passport.authenticate('local', {}, (err, user, info) => {
			if (err || !user) {
				res.status(422).send(info);
			} else {
				// Remove sensitive data before login
				user.password = undefined;
				user.salt = undefined;
				req.login(user, loginErr => {
					if (loginErr) {
						res.status(400).send(loginErr);
					} else {
						res.json(user);
					}
				});
			}
		})(req, res, next);
	};

	/**
	 * Signout
	 */
	public signout = (req, res) => {
		// ensureOrgs (req.user, req.user.orgsAdmin.concat (req.user.orgsMember, req.user.orgsPending))
		req.logout();
		res.redirect('/');
	};

	/**
	 * OAuth provider call
	 */
	public oauthCall = (strategy, scope) => {
		return (req, res, next) => {
			// Authenticate
			passport.authenticate(strategy, {}, scope)(req, res, next);
		};
	};

	/**
	 * OAuth callback
	 */
	public oauthCallback = strategy => {
		return (req, res, next) => {
			// info.redirect_to contains inteded redirect path
			passport.authenticate(strategy, {}, (err, user, info) => {
				if (err) {
					return res.redirect('/authentication/signin?err=' + encodeURIComponent(this.errorHandler.getErrorMessage(err)));
				}
				if (!user) {
					return res.redirect('/authentication/signin');
				}
				req.login(user, loginErr => {
					if (loginErr) {
						return res.redirect('/authentication/signin');
					}
					if (!user.email) {
						return res.redirect(info.redirect_to || '/settings/profile');
					} else {
						return res.redirect(info.redirect_to || '/');
					}
				});
			})(req, res, next);
		};
	};

	/**
	 * Helper function to save or update a OAuth user profile
	 */
	public saveOAuthUserProfile = (req, providerUserProfile, done) => {
		if (!req.user) {
			// Define a search query fields
			const searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
			const searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

			// Define main provider search query
			const mainProviderSearchQuery: any = {};
			mainProviderSearchQuery.provider = providerUserProfile.provider;
			mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

			// Define additional provider search query
			const additionalProviderSearchQuery: any = {};
			additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

			// Define a search query to find existing user with current provider profile
			const searchQuery = {
				$or: [mainProviderSearchQuery, additionalProviderSearchQuery]
			};

			// Setup info object
			const info: any = {};

			// Set redirection path on session.
			// Do not redirect to a signin or signup page
			if (this.noReturnUrls.indexOf(req.query.redirect_to) === -1) {
				info.redirect_to = req.query.redirect_to;
			}

			User.findOne(searchQuery, (err, user) => {
				if (err) {
					return done(err);
				} else {
					if (!user) {
						const possibleUsername = providerUserProfile.username || (providerUserProfile.email ? providerUserProfile.email.split('@')[0] : '');

						User.findUniqueUsername(possibleUsername, null, availableUsername => {
							user = new User({
								firstName: providerUserProfile.firstName,
								lastName: providerUserProfile.lastName,
								username: availableUsername,
								displayName: providerUserProfile.displayName,
								profileImageURL: providerUserProfile.profileImageURL,
								provider: providerUserProfile.provider,
								providerData: providerUserProfile.providerData
							});

							// Email intentionally added later to allow defaults (sparse settings) to be applid.
							// Handles case where no email is supplied.
							// See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
							user.email = providerUserProfile.email;

							// And save the user
							user.save(saveErr => {
								this.claimMessages(user);
								return done(saveErr, user, info);
							});
						});
					} else {
						return done(err, user, info);
					}
				}
			});
		} else {
			// User is already logged in, join the provider data to the existing user
			const user = req.user;

			// Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
			if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
				// Add the provider data to the additional provider data field
				if (!user.additionalProvidersData) {
					user.additionalProvidersData = {};
				}

				user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

				// Then tell mongoose that we've updated the additionalProvidersData field
				user.markModified('additionalProvidersData');

				// And save the user
				user.save(err => {
					return done(err, user, '/settings/accounts');
				});
			} else {
				return done(new Error('User is already connected using this provider'), user);
			}
		}
	};

	/**
	 * Remove OAuth provider
	 */
	public removeOAuthProvider = (req, res) => {
		const user = req.user;
		const provider = req.query.provider;

		if (!user) {
			return res.status(401).json({
				message: 'User is not authenticated'
			});
		} else if (!provider) {
			return res.status(400).send();
		}

		// Delete the additional provider
		if (user.additionalProvidersData[provider]) {
			delete user.additionalProvidersData[provider];

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');
		}

		user.save(err => {
			if (err) {
				return res.status(422).send({
					message: this.errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, loginErr => {
					if (loginErr) {
						return res.status(400).send(loginErr);
					} else {
						return res.json(user);
					}
				});
			}
		});
	};

	public grantGovernmentRole = (req, res) => {
		const requestingUserId = req.params.requestingUserId;
		if (requestingUserId) {
			User.findById(requestingUserId, 'id roles').exec((err, requestingUser) => {
				if (err) {
					return res.status(422).send({
						message: this.errorHandler.getErrorMessage(err)
					});
				} else {
					// remove gov-request role
					const index = requestingUser.roles.indexOf('gov-request');
					if (index > 0) {
						requestingUser.roles.splice(index, 1);
					}

					let responseType;
					let notificationMessage;
					if (req.params.actionCode === 'decline') {
						// set response types and messages
						responseType = 'gov-request-declined';
						notificationMessage = '<i class="fas fa-lg fa-check-circle"></i> Goverment membership request declined.';
					} else {
						// set roles to include gov
						requestingUser.roles.push('gov');

						// set response types and messages
						responseType = 'gov-request-approved';
						notificationMessage = '<i class="fas fa-lg fa-check-circle"></i> Goverment membership request approved.';
					}

					// save user and return notification
					requestingUser.save(saveErr => {
						if (saveErr) {
							return res.status(422).send({
								message: this.errorHandler.getErrorMessage(saveErr)
							});
						} else {
							// send message to requesting user letting them know request has been approved
							this.sendMessages(responseType, [requestingUser.id], { requestingUser });
							return res.status(200).send({
								message: notificationMessage
							});
						}
					});
				}
			});
		}
	};

	private ensureOrgs = (user, orglist) => {
		const Org = mongoose.model('Org');
		const plist = orglist.map(orgid => {
			return new Promise((resolve, reject) => {
				Org.findById(orgid).exec((err, org) => {
					if (err || !org) {
						user.orgsAdmin.pull(orgid);
						user.orgsMember.pull(orgid);
						user.orgsPending.pull(orgid);
					}
					resolve();
				});
			});
		});
		Promise.all(plist).then(() => {
			user.markModified('orgsAdmin');
			user.markModified('orgsMember');
			user.markModified('orgsPending');
			user.save();
		});
	};
}
