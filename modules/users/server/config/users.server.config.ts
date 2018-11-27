'use strict';

import * as passport from 'passport';
import * as config from '../../../../config/config';
import { User } from '../models/user.server.model';
import { GitHubAuthStrategy } from './strategies/github';
import { LocalAuthStrategy } from './strategies/local';

export class UsersConfig {
	public init = app => {
		// Serialize sessions
		passport.serializeUser((user, done) => {
			done(null, user.id);
		});

		// Deserialize sessions
		passport.deserializeUser((id, done) => {
			User.findOne(
				{
					_id: id
				},
				'-salt -password'
			)
				.populate('capabilities', 'code name')
				.populate('capabilitySkills', 'code name')
				.exec((err, user) => {
					done(err, user);
				});
		});

		const githubAuthStrategy = new GitHubAuthStrategy();
		githubAuthStrategy.init(config);

		const localAuthStrategy = new LocalAuthStrategy();
		localAuthStrategy.init();

		// Add passport's middleware
		app.use(passport.initialize({}));
		app.use(passport.session({}));
	};
}
