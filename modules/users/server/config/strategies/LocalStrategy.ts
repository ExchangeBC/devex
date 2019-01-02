'use strict';

import passport from 'passport';
import passportLocal from 'passport-local';
import { UserModel } from '../../models/UserModel';

export default class LocalAuthStrategy {
	public init = () => {
		// Use local strategy
		passport.use(
			'local',
			new passportLocal.Strategy(
				(username, password, done) => {
					UserModel.findOne({
						$or: [
							{
								username: username.toLowerCase()
							},
							{
								email: username.toLowerCase()
							}
						]
					})
						.populate('capabilities', 'code name')
						.populate('capabilitySkills', 'code name')
						.exec((err, user) => {
							if (err) {
								return done(err);
							}
							if (!user || !user.authenticate(password)) {
								return done(null, false, {
									message: 'Invalid username or password (' + new Date().toLocaleTimeString() + ')'
								});
							}

							return done(null, user);
						});
				}
			)
		);
	};
}
