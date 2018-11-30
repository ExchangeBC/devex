'use strict';

import { UserAuthenticationController } from '../controllers/users/users.authentication.server.controller';
import { UserPasswordController } from '../controllers/users/users.password.server.controller';
import { AuthPolicy } from '../policies/auth.server.policy';

export class AuthRouter {

	private userAuthenticationController = new UserAuthenticationController();
	private userPasswordController = new UserPasswordController();
	private authPolicy = new AuthPolicy();

	public setupRoutes = app => {
		// Setting up the users password api
		app.route('/api/auth/forgot')
			.all(this.authPolicy.isAllowed)
			.post(this.userPasswordController.forgot);

		app.route('/api/auth/reset/:token')
			.all(this.authPolicy.isAllowed)
			.get(this.userPasswordController.validateResetToken);

		app.route('/api/auth/reset/:token')
			.all(this.authPolicy.isAllowed)
			.post(this.userPasswordController.reset);

		// Setting up the users authentication api
		app.route('/api/auth/signup')
			.all(this.authPolicy.isAllowed)
			.post(this.userAuthenticationController.signup);

		app.route('/api/auth/signin')
			.all(this.authPolicy.isAllowed)
			.post(this.userAuthenticationController.signin);

		app.route('/api/auth/signout')
			.all(this.authPolicy.isAllowed)
			.get(this.userAuthenticationController.signout);

		// Setting the github oauth routes
		app.route('/api/auth/github')
			.all(this.authPolicy.isAllowed)
			.get(this.userAuthenticationController.oauthCall('github', {}));

		app.route('/api/auth/github/callback')
			.all(this.authPolicy.isAllowed)
			.get(this.userAuthenticationController.oauthCallback('github'));
	};
}
