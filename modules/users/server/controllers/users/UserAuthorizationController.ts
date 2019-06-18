'use strict';

import _ from 'lodash';
import { Types } from 'mongoose';
import { UserModel } from '../../models/UserModel';

class UserAuthorizationController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UserAuthorizationController;

	private constructor() {};

	public userByID = (req, res, next, id) => {
		if (!Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'User is invalid'
			});
		}

		UserModel.findOne({
			_id: id
		})
			.populate('capabilities', 'code name')
			.populate('capabilitySkills', 'code name')
			.populate('orgsAdmin')
			.populate('orgsPending')
			.populate('orgsMember')
			.exec((err, user) => {
				if (err) {
					return next(err);
				} else if (!user) {
					return next(new Error('Failed to load User ' + id));
				}

				req.profile = user;
				next();
			});
	};
}

export default UserAuthorizationController.getInstance();
