'use strict';

import { Request, Response } from 'express';
import fetch from 'node-fetch';
import validator from 'validator';
import config from '../../../../config/ApplicationConfig';
import { SubscriptionModel } from '../models/SubscriptionModel';

export class CoreServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CoreServerController;

	private constructor() {}

	// Render the main application page
	public renderIndex = (req, res) => {
		let safeUserObject = null;
		if (req.user) {
			safeUserObject = {
				_id: req.user._id,
				orgsAdmin: req.user.orgsAdmin,
				orgsMember: req.user.orgsMember,
				orgsPending: req.user.orgsPending,
				displayName: validator.escape(req.user.displayName),
				provider: validator.escape(req.user.provider),
				username: validator.escape(req.user.username),
				created: req.user.created.toString(),
				roles: req.user.roles,
				profileImageURL: req.user.profileImageURL,
				email: validator.escape(req.user.email),
				lastName: validator.escape(req.user.lastName),
				firstName: validator.escape(req.user.firstName),
				additionalProvidersData: req.user.additionalProvidersData,
				government: req.user.government,
				notifyOpportunities: req.user.notifyOpportunities,
				notifyEvents: req.user.notifyEvents,
				notifyBlogs: req.user.notifyBlogs,
				userTitle: req.user.userTitle,
				isDisplayEmail: req.user.isDisplayEmail,
				isDeveloper: req.user.isDeveloper,
				paymentMethod: req.user.paymentMethod,
				phone: validator.escape(req.user.phone),
				address: validator.escape(req.user.address),
				businessContactName: validator.escape(req.user.businessContactName),
				businessContactEmail: validator.escape(req.user.businessContactEmail),
				businessContactPhone: validator.escape(req.user.businessContactPhone),
				businessName: validator.escape(req.user.businessName),
				businessAddress: validator.escape(req.user.businessAddress),
				businessAddress2: validator.escape(req.user.businessAddress2),
				businessCity: validator.escape(req.user.businessCity),
				businessProvince: req.user.businessProvince,
				businessCode: validator.escape(req.user.businessCode),
				location: req.user.location,
				description: validator.escape(req.user.description),
				website: req.user.website,
				skills: req.user.skills,
				skillsData: req.user.skillsData,
				badges: req.user.badges,
				capabilities: req.user.capabilities,
				endorsements: req.user.endorsements,
				github: req.user.github,
				stackOverflow: req.user.stackOverflow,
				stackExchange: req.user.stackExchange,
				linkedIn: req.user.linkedIn,
				isPublicProfile: req.user.isPublicProfile,
				isAutoAdd: req.user.isAutoAdd,
				capabilityDetails: req.user.capabilityDetails,
				capabilitySkills: req.user.capabilitySkills
			};
		}

		res.render('public/dist/server-views/index', {
			user: JSON.stringify(safeUserObject),
			sharedConfig: JSON.stringify(config.shared)
		});
	};

	// Render the server error (500) page
	public renderServerError = (req, res) => {
		res.status(500).render('public/dist/server-views/500', {
			error: 'Oops! Something went wrong...'
		});
	};

	// Render the server not found (404) page
	public renderNotFound = (req, res) => {
		res.status(404).format({
			'text/html'() {
				res.render('public/dist/server-views/404', {
					url: req.originalUrl
				});
			},
			'application/json'() {
				res.json({
					error: 'Path not found'
				});
			},
			default() {
				res.send('Path not found');
			}
		});
	};

	public async verifyNotABot(req: Request, res: Response): Promise<void> {
		const token = req.body.token;
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
		});

		const respJSON = await response.json();
		if (respJSON.success) {
			res.send({
				message: 'valid'
			});
		} else {
			res.send({
				message: 'invalid'
			})
		}
	}

	public async saveNewsletterEmail(req: Request, res: Response): Promise<void> {
		try {
			const subscription = new SubscriptionModel(req.body);

			// check for existing email
			const existingEmails = await SubscriptionModel.find({ email: subscription.email });
			if (existingEmails && existingEmails.length > 0) {
				res.status(422).send({
					message: 'Email has already been subscribed'
				});
				return;
			}

			const savedSubscription = await subscription.save();
			res.json(savedSubscription);
		} catch (error) {
			res.status(422).send({
				message: `Error: ${error}`
			});
		}
	}

	public async removeNewsletterSub(req: Request, res: Response): Promise<void> {
		try {
			const deletedEmail = await SubscriptionModel.findOneAndDelete({ email: req.body.email });
			res.json(deletedEmail);
		} catch (error) {
			res.status(422).send({
				message: `Error: ${error}`
			});
		}
	}
}

export default CoreServerController.getInstance();
