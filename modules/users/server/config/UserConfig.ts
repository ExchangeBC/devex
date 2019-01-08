'use strict';

import passport from 'passport';
import config from '../../../../config/ApplicationConfig';
import { UserModel } from '../models/UserModel';
import GitHubAuthStrategy from './strategies/GitHubStrategy';
import LocalAuthStrategy from './strategies/LocalStrategy';

class UserConfig {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UserConfig;

	private constructor() {}
	public init = app => {
		// Serialize sessions
		passport.serializeUser((user: any, done) => {
			done(null, user.id);
		});

		// Deserialize sessions
		passport.deserializeUser((id, done) => {
			UserModel.findOne(
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
		app.use(passport.initialize());
		app.use(passport.session());
	};
}

export default UserConfig.getInstance();
