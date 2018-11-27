'use strict';

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { User } from '../../models/user.server.model';

export class UserAuthorizationController {
	public userByID = (req, res, next, id) => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'User is invalid'
			});
		}

		User.findOne({
			_id: id
		})
			.populate('capabilities', 'code name')
			.populate('capabilitySkills', 'code name')
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
