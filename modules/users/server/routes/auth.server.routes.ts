'use strict';

import * as users from '../controllers/users.server.controller';

export class AuthRouter {
	public setupRoutes = app => {
		// Setting up the users password api
		app.route('/api/auth/forgot').post(users.forgot);
		app.route('/api/auth/reset/:token').get(users.validateResetToken);
		app.route('/api/auth/reset/:token').post(users.reset);

		// Setting up the users authentication api
		app.route('/api/auth/signup').post(users.signup);
		app.route('/api/auth/signin').post(users.signin);
		app.route('/api/auth/signout').get(users.signout);

		// Setting the github oauth routes
		app.route('/api/auth/github').get(users.oauthCall('github'));
		app.route('/api/auth/github/callback').get(users.oauthCallback('github'));
	};
}
