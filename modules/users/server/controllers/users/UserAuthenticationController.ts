'use strict';

import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import CoreServerErrors from '../../../../core/server/controllers/CoreServerErrors';
import MessagesServerController from '../../../../messages/server/controllers/MessagesServerController';
import { IUserModel, UserModel } from '../../models/UserModel';

class UserAuthenticationController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UserAuthenticationController;

	private sendMessages = MessagesServerController.sendMessages;

	// URLs for which user can't be redirected on signin
	private noReturnUrls = ['/authentication/signin', '/authentication/signup'];

	private constructor() {
		this.signin = this.signin.bind(this);
		this.signup = this.signup.bind(this);
	}

	public signup(req: Request, res: Response): void {
		// For security measurement we remove the roles from the req.body object
		delete req.body.roles;

		// Init user and add missing fields
		const user = new UserModel(req.body);
		user.provider = 'local';
		user.displayName = user.firstName + ' ' + user.lastName;
		if (user.government) {
			user.roles = ['gov-request', 'user'];
		}

		// Then save the user
		user.save(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				// Remove sensitive data before login
				user.password = undefined;
				user.salt = undefined;
				req.login(user, this.handleLoginResponse(res, user));
			}
		});
	};

	/**
	 * Signin after passport authentication
	 */
	public signin(req: Request, res: Response, next: NextFunction) {
		passport.authenticate('local', {}, (err, user, info) => {
			if (err || !user) {
				res.status(422).send(info);
			} else {
				// Remove sensitive data before login
				user.password = undefined;
				user.salt = undefined;
				req.login(user, this.handleLoginResponse(res, user));
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
					return res.redirect('/authentication/signin?err=' + encodeURIComponent(CoreServerErrors.getErrorMessage(err)));
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

			// Define main provider search query
			const mainProviderSearchQuery: any = {};
			mainProviderSearchQuery.provider = providerUserProfile.provider;
			mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

			// Setup info object
			const info: any = {};

			// Set redirection path on session.
			// Do not redirect to a signin or signup page
			if (this.noReturnUrls.indexOf(req.query.redirect_to) === -1) {
				info.redirect_to = req.query.redirect_to;
			}

			UserModel.findOne(mainProviderSearchQuery, (err, user) => {
				if (err) {
					return done(err);
				} else {
					if (!user) {
						const possibleUsername = providerUserProfile.username || (providerUserProfile.email ? providerUserProfile.email.split('@')[0] : '');

						UserModel.schema.statics.findUniqueUsername(possibleUsername, null, availableUsername => {
							user = new UserModel({
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
								return done(saveErr, user, info);
							});
						});
					} else {
						return done(err, user, info);
					}
				}
			});
		} else {
			return done(new Error('You are already signed in'));
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
					message: CoreServerErrors.getErrorMessage(err)
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
			UserModel.findById(requestingUserId, 'id roles').exec((err, requestingUser) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
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
								message: CoreServerErrors.getErrorMessage(saveErr)
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

	private handleLoginResponse(res: Response, user: IUserModel) {
		return (loginErr: any) => {
			if (loginErr) {
				res.status(400).send(loginErr);
			} else {
				res.json(user);
			}
		}
	}
}

export default UserAuthenticationController.getInstance();
