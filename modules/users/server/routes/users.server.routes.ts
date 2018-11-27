'use strict';

import { UserAuthenticationController } from '../controllers/users/users.authentication.server.controller';
import { UserAuthorizationController } from '../controllers/users/users.authorization.server.controller';
import { UserPasswordController } from '../controllers/users/users.password.server.controller';
import { UserProfileController } from '../controllers/users/users.profile.server.controller';

export class UsersRouter {
	private userProfileController = new UserProfileController();
	private userPasswordController = new UserPasswordController();
	private userAuthenticationController = new UserAuthenticationController();
	private userAuthorizationController = new UserAuthorizationController();

	public setupRoutes = app => {
		// Setting up the users profile api
		app.route('/api/users/me').get(this.userProfileController.me);
		app.route('/api/users').put(this.userProfileController.update);
		app.route('/api/users/delete').get(this.userProfileController.removeSelf);
		app.route('/api/users/accounts').delete(this.userAuthenticationController.removeOAuthProvider);
		app.route('/api/users/password').post(this.userPasswordController.changePassword);
		app.route('/api/users/picture').post(this.userProfileController.changeProfilePicture);
		app.route('/api/users/count').get(this.userProfileController.count);

		// Finish by binding the user middleware
		app.param('userId', this.userAuthorizationController.userByID);
	};
}
