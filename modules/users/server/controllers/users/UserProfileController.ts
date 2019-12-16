'use strict';

import { Request, Response } from 'express';
import fs from 'fs';
import _ from 'lodash';
import multer from 'multer';
import validator from 'validator';
import config from '../../../../../config/ApplicationConfig';
import CoreServerErrors from '../../../../core/server/controllers/CoreServerErrors';
import { SubscriptionModel } from '../../../../core/server/models/SubscriptionModel';
import MessagesServerController from '../../../../messages/server/controllers/MessagesServerController';
import OrgsServerController from '../../../../orgs/server/controllers/OrgsServerController';
import { IUserModel, UserModel } from '../../models/UserModel';

class UserProfileController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UserProfileController;

	private sendMessages = MessagesServerController.sendMessages;
	private whitelistedFields = [
		'orgsAdmin',
		'orgsMember',
		'orgsPending',
		'_id',
		'firstName',
		'lastName',
		'email',
		'username',
		'government',
		'notifyOpportunities',
		'subscribeOpportunitiesId',
		'notifyEvents',
		'notifyBlogs',
		'userTitle',
		'isDisplayEmail',
		'isDeveloper',
		'paymentMethod',
		'phone',
		'address',
		'businessContactName',
		'businessContactEmail',
		'businessContactPhone',
		'businessName',
		'businessAddress',
		'businessAddress2',
		'businessCity',
		'businessProvince',
		'businessCode',
		'location',
		'description',
		'website',
		'skills',
		'skillsData',
		'badges',
		'capabilities',
		'endorsements',
		'github',
		'stackOverflow',
		'stackExchange',
		'linkedIn',
		'isPublicProfile',
		'isAutoAdd',
		'capabilityDetails',
		'capabilitySkills'
	];

	private constructor() {}

	public update = (req, res) => {
		// Init Variables
		if (req.user) {
			// user = _.extend(user, _.pick(req.body, whitelistedFields));
			const user = _.mergeWith(req.user, _.pick(req.body, this.whitelistedFields), (objValue, srcValue) => {
				if (_.isArray(objValue)) {
					return srcValue;
				}
			});

			user.email = user.email.toLowerCase();

			// Previous state of user
			//
			// this deals with marking the user as government or not
			//
			if (req.body.addRequest) {
				user.addRoles(['gov-request']);
				// Send request message and email to each admin in the system
				UserModel.find({ roles: { $in: ['admin'] } }).then(admins => {
					this.sendMessages('gov-member-request', admins, { requestingUser: user });
				});
			}

			user.updated = Date.now();
			user.displayName = user.firstName + ' ' + user.lastName;

			return user.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					// Check whether the RFQ is now met for any of the orgs that the user is a member of
					const updatedOrgs = user.orgsMember.map( async orgId => {
						const org = await OrgsServerController.getOrgById(orgId);
						return await OrgsServerController.checkIfRFQMet(org);
					});

					req.login(user, loginErr => {
						if (loginErr) {
							res.status(400).send(loginErr);
						} else {
							res.json(user);
						}
					});
				}
			});
		} else {
			res.status(401).send({
				message: 'User is not signed in'
			});
		}
	};

	/**
	 * Update profile picture
	 */
	public changeProfilePicture = (req, res) => {
		const user = req.user;
		const storage = multer.diskStorage(config.uploads.diskStorage);
		const upload = multer({ storage }).single('newProfilePicture');
		let existingImageUrl;

		if (user) {
			existingImageUrl = user.profileImageURL;
			uploadImage()
				.then(updateUser)
				.then(deleteOldImage)
				.then(login)
				.then(() => {
					res.json(user);
				})
				.catch(err => {
					res.status(422).send(err);
				});
		} else {
			res.status(401).send({
				message: 'User is not signed in'
			});
		}

		function uploadImage() {
			return new Promise((resolve, reject) => {
				upload(req, res, uploadError => {
					if (uploadError) {
						reject(CoreServerErrors.getErrorMessage(uploadError));
					} else {
						resolve();
					}
				});
			});
		}

		function updateUser() {
			return new Promise((resolve, reject) => {
				user.profileImageURL = '/' + config.uploads.profileUpload.display + req.file.filename;
				user.save(err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}

		function deleteOldImage() {
			return new Promise((resolve, reject) => {
				if (existingImageUrl !== 'img/default.png') {
					fs.unlink(existingImageUrl, () => {
						resolve();
					});
				} else {
					resolve();
				}
			});
		}

		function login() {
			return new Promise((resolve, reject) => {
				req.login(user, err => {
					if (err) {
						res.status(400).send(err);
					} else {
						resolve();
					}
				});
			});
		}
	};

	public me = (req, res) => {
		// Sanitize the user - short term solution. Copied from core.server.controller.js
		// CC:  USERFIELDS
		let safeUserObject = null;
		if (req.user) {
			safeUserObject = {
				displayName: validator.escape(req.user.displayName),
				provider: validator.escape(req.user.provider),
				username: validator.escape(req.user.username),
				created: req.user.created.toString(),
				roles: req.user.roles,
				orgsAdmin: req.user.orgsAdmin,
				orgsMember: req.user.orgsMember,
				orgsPending: req.user.orgsPending,
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
				phone: req.user.phone,
				address: req.user.address,
				businessContactName: validator.escape(req.user.businessContactName),
				businessContactEmail: validator.escape(req.user.businessContactEmail),
				businessContactPhone: validator.escape(req.user.businessContactPhone),
				isDeveloper: req.user.isDeveloper,
				paymentMethod: req.user.paymentMethod,
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

		res.json(safeUserObject || null);
	};

	public count = (req, res) => {
		UserModel.countDocuments({}, (err, cnt) => {
			if (err) {
				res.status(400).send(err);
			} else {
				res.json({ count: cnt });
			}
		});
	};

	public removeSelf = (req, res) => {
		if (req.user) {
			const id = req.user._id;
			req.logout();
			// res.redirect('/');
			UserModel.deleteOne({ _id: id }, err => {
				if (err) {
					res.status(500).send({
						message: 'Unable to delete profile!'
					});
				} else {
					res.status(200).send({
						message: 'User profile deleted'
					});
				}
			});
		}
	};

	public async newsletterSubscriptionStatus(req: Request, res: Response): Promise<void> {
		try {
			const user = req.user as IUserModel;
			const subscribedUsers = await SubscriptionModel.find({ email: user.email });
			if (subscribedUsers && subscribedUsers.length > 0) {
				res.json({
					subscribed: true
				});
			} else {
				res.json({
					subscribed: false
				});
			}
		} catch (error) {
			res.status(500).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}
}

export default UserProfileController.getInstance();
