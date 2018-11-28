'use strict';

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { CoreErrors } from '../../../core/server/controllers/errors.server.controller';
import { User } from '../models/user.server.model';

export class AdminController {
	private errorHandler = new CoreErrors();

	public read = (req, res) => {
		res.json(req.model);
	};

	public update = (req, res) => {
		const user = req.model;
		// CC:USERFIELDS
		// For security purposes only merge these parameters
		user.orgsAdmin = req.user.orgsAdmin;
		user.orgsMember = req.user.orgsMember;
		user.orgsPending = req.user.orgsPending;
		user.phone = req.user.phone;
		user.address = req.user.address;
		user.businessContactName = req.user.businessContactName;
		user.businessContactEmail = req.user.businessContactEmail;
		user.businessContactPhone = req.user.businessContactPhone;
		user.firstName = req.body.firstName;
		user.lastName = req.body.lastName;
		user.displayName = user.firstName + ' ' + user.lastName;
		user.roles = req.body.roles;
		user.government = req.body.government;
		user.userTitle = req.body.userTitle;
		user.notifyOpportunities = req.body.notifyOpportunities;
		user.notifyEvents = req.body.notifyEvents;
		user.notifyBlogs = req.body.notifyBlogs;
		user.isDisplayEmail = req.body.isDisplayEmail;
		user.isDeveloper = req.body.isDeveloper;
		user.paymentMethod = req.body.paymentMethod;
		user.businessName = req.body.businessName;
		user.businessAddress = req.body.businessAddress;
		user.businessAddress2 = req.body.businessAddress2;
		user.businessCity = req.body.businessCity;
		user.businessProvince = req.body.businessProvince;
		user.businessCode = req.body.businessCode;
		user.location = req.body.location;
		user.description = req.body.description;
		user.website = req.body.website;
		user.skills = req.body.skills;
		user.skillsData = req.body.skillsData;
		user.badges = req.body.badges;
		user.capabilities = req.body.capabilities;
		user.endorsements = req.body.endorsements;
		user.github = req.body.github;
		user.stackOverflow = req.body.stackOverflow;
		user.stackExchange = req.body.stackExchange;
		user.linkedIn = req.body.linkedIn;
		user.isPublicProfile = req.user.isPublicProfile;
		user.isAutoAdd = req.user.isAutoAdd;
		user.capabilityDetails = req.body.capabilityDetails;
		user.capabilitySkills = req.body.capabilitySkills;

		user.save(err => {
			if (err) {
				return res.status(422).send({
					message: this.errorHandler.getErrorMessage(err)
				});
			}

			res.json(user);
		});
	};

	public delete = (req, res) => {
		const user = req.model;

		user.remove(err => {
			if (err) {
				return res.status(422).send({
					message: this.errorHandler.getErrorMessage(err)
				});
			}

			res.json();
		});
	};

	/**
	 * List of Users
	 */
	public list = (req, res) => {
		User.find({}, '-salt -password -providerData')
			.sort('-created')
			.populate('user', 'displayName')
			.exec((err, users) => {
				if (err) {
					return res.status(422).send({
						message: this.errorHandler.getErrorMessage(err)
					});
				}

				res.json(users);
			});
	};

	/**
	 * User middleware
	 */
	public userByID = (req, res, next, id) => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'User is invalid'
			});
		}

		User.findById(id, '-salt -password -providerData')
			.populate('capabilities', 'code name')
			.populate('capabilitySkills', 'code name')
			.exec((err, user) => {
				if (err) {
					return next(err);
				} else if (!user) {
					return next(new Error('Failed to load user ' + id));
				}
				req.model = user;
				next();
			});
	};

	public approve = (req, res, next) => {
		User.findOne({
			_id: req.body.user._id
		})
			.populate('capabilities', 'code name')
			.populate('capabilitySkills', 'code name')
			.exec((err, user) => {
				if (err) {
					return next(err);
				} else if (!user) {
					return next(new Error('Failed to load User ' + req.body.user._id));
				}
				user.roles = req.body.flag === 1 ? ['gov', 'user'] : ['user'];

				user.save(saveErr => {
					if (saveErr) {
						return res.status(422).send({
							message: this.errorHandler.getErrorMessage(saveErr)
						});
					} else {
						res.status(200).send({
							message: 'done'
						});
					}
				});
			});
	};
}
