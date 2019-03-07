'use strict';

import async from 'async';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import config from '../../../../../config/ApplicationConfig';
import CoreServerErrors from '../../../../core/server/controllers/CoreServerErrors';
import { UserModel } from '../../models/UserModel';

class UserPasswordController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UserPasswordController;

	private smtpTransport = nodemailer.createTransport(config.mailer.options);

	private constructor() {}

	/**
	 * Forgot for reset password (forgot POST)
	 */
	public forgot = (req, res, next) => {
		async.waterfall(
			[
				// Generate random token
				done => {
					crypto.randomBytes(20, (err, buffer) => {
						const token = buffer.toString('hex');
						done(err, token);
					});
				},
				// Lookup user by username
				(token, done) => {
					if (req.body.username) {
						UserModel.findOne(
							{
								username: req.body.username.toLowerCase()
							},
							'-salt -password',
							(err, user) => {
								if (err || !user) {
									return res.status(400).send({
										message: 'No account with that username has been found'
									});
								} else if (user.provider !== 'local') {
									return res.status(400).send({
										message: 'It seems like you signed up using your ' + user.provider + ' account'
									});
								} else {
									user.resetPasswordToken = token;
									user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

									user.save(saveErr => {
										done(saveErr, token, user);
									});
								}
							}
						);
					} else {
						return res.status(422).send({
							message: 'Username field must not be blank'
						});
					}
				},
				(token, user, done) => {
					let httpTransport = 'http://';
					if (config.secure && config.secure.ssl === true) {
						httpTransport = 'https://';
					}
					const baseUrl = req.app.get('domain') || httpTransport + req.headers.host;
					res.render(
						'public/dist/server-views/reset-password-email',
						{
							name: user.displayName,
							appName: config.app.title,
							url: baseUrl + '/api/auth/reset/' + token
						},
						(err, emailHTML) => {
							done(err, emailHTML, user);
						}
					);
				},
				// If valid email, send reset email using service
				(emailHTML, user, done) => {
					const mailOptions = {
						to: user.email,
						from: config.mailer.from,
						subject: 'Password Reset',
						html: emailHTML
					};
					this.smtpTransport.sendMail(mailOptions, err => {
						if (!err) {
							res.send({
								message: 'An email has been sent to the provided email with further instructions.'
							});
						} else {
							return res.status(400).send({
								message: 'Failure sending email'
							});
						}

						done(err);
					});
				}
			],
			this.handleErr(next)
		);
	};

	/**
	 * Reset password GET from email token
	 */
	public validateResetToken = (req, res) => {
		UserModel.findOne(
			{
				resetPasswordToken: req.params.token,
				resetPasswordExpires: {
					$gt: Date.now()
				}
			},
			(err, user) => {
				if (err || !user) {
					return res.redirect('/password/reset/invalid');
				}

				res.redirect('/password/reset/' + req.params.token);
			}
		);
	};

	/**
	 * Reset password POST from email token
	 */
	public async reset(req: Request, res: Response, next: NextFunction): Promise<void> {
		// Init Variables
		const passwordDetails = req.body;

		async.waterfall(
			[
				done => {
					UserModel.findOne(
						{
							resetPasswordToken: req.params.token,
							resetPasswordExpires: {
								$gt: Date.now()
							}
						},
						(err, user) => {
							if (!err && user) {
								if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
									user.password = passwordDetails.newPassword;
									user.resetPasswordToken = undefined;
									user.resetPasswordExpires = undefined;

									user.save(saveErr => {
										if (saveErr) {
											return res.status(422).send({
												message: CoreServerErrors.getErrorMessage(saveErr)
											});
										} else {
											req.login(user, loginErr => {
												if (loginErr) {
													res.status(400).send(loginErr);
												} else {
													// Remove sensitive data before return authenticated user
													user.password = undefined;
													user.salt = undefined;

													res.json(user);

													done(loginErr, user);
												}
											});
										}
									});
								} else {
									return res.status(422).send({
										message: 'Passwords do not match'
									});
								}
							} else {
								return res.status(400).send({
									message: 'Password reset token is invalid or has expired.'
								});
							}
						}
					);
				},
				(user, done) => {
					res.render(
						'public/dist/server-views/reset-password-confirm-email',
						{
							name: user.displayName,
							appName: config.app.title
						},
						(err, emailHTML) => {
							done(err, emailHTML, user);
						}
					);
				},
				// If valid email, send reset email using service
				(emailHTML, user, done) => {
					const mailOptions = {
						to: user.email,
						from: config.mailer.from,
						subject: 'Your password has been changed',
						html: emailHTML
					};

					this.smtpTransport.sendMail(mailOptions, err => {
						done(err, 'done');
					});
				}
			],
			this.handleErr(next)
		);
	};

	/**
	 * Change Password
	 */
	public changePassword = (req, res) => {
		// Init Variables
		const passwordDetails = req.body;

		if (req.user) {
			if (passwordDetails.newPassword) {
				UserModel.findById(req.user.id, (err, user) => {
					if (!err && user) {
						if (user.authenticate(passwordDetails.currentPassword)) {
							if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
								user.password = passwordDetails.newPassword;

								user.save(saveErr => {
									if (saveErr) {
										return res.status(422).send({
											message: CoreServerErrors.getErrorMessage(saveErr)
										});
									} else {
										req.login(user, loginErr => {
											if (loginErr) {
												res.status(400).send(loginErr);
											} else {
												res.send({
													message: 'Password changed successfully'
												});
											}
										});
									}
								});
							} else {
								res.status(422).send({
									message: 'Passwords do not match'
								});
							}
						} else {
							res.status(422).send({
								message: 'Current password is incorrect'
							});
						}
					} else {
						res.status(400).send({
							message: 'User is not found'
						});
					}
				});
			} else {
				res.status(422).send({
					message: 'Please provide a new password'
				});
			}
		} else {
			res.status(401).send({
				message: 'User is not signed in'
			});
		}
	};

	private handleErr(next: NextFunction) {
		return (err: any) => {
			if (err) {
				return next(err);
			}
		}
	}
}

export default UserPasswordController.getInstance();
