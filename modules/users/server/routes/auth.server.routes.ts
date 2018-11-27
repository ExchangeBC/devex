'use strict';

import { UserAuthenticationController } from '../controllers/users/users.authentication.server.controller';
import { UserPasswordController } from '../controllers/users/users.password.server.controller';

export class AuthRouter {

	private userAuthenticationController = new UserAuthenticationController();
	private userPasswordController = new UserPasswordController();

	public setupRoutes = app => {
		// Setting up the users password api
		app.route('/api/auth/forgot').post(this.userPasswordController.forgot);
		app.route('/api/auth/reset/:token').get(this.userPasswordController.validateResetToken);
		app.route('/api/auth/reset/:token').post(this.userPasswordController.reset);

		// Setting up the users authentication api
		app.route('/api/auth/signup').post(this.userAuthenticationController.signup);
		app.route('/api/auth/signin').post(this.userAuthenticationController.signin);
		app.route('/api/auth/signout').get(this.userAuthenticationController.signout);

		// Setting the github oauth routes
		app.route('/api/auth/github').get(this.userAuthenticationController.oauthCall('github', {}));
		app.route('/api/auth/github/callback').get(this.userAuthenticationController.oauthCallback('github'));
	};
}
