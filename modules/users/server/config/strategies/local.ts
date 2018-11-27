'use strict';

import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import { User } from '../../models/user.server.model';

export class LocalAuthStrategy {
	private LocalStrategy = passportLocal;

	public init = () => {
		// Use local strategy
		passport.use(
			'local',
			new this.LocalStrategy(
				{
					usernameField: 'usernameOrEmail',
					passwordField: 'password'
				},
				(usernameOrEmail, password, done) => {
					User.findOne({
						$or: [
							{
								username: usernameOrEmail.toLowerCase()
							},
							{
								email: usernameOrEmail.toLowerCase()
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
