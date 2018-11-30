'use strict';

import { UserAuthorizationController } from '../controllers/users/users.authorization.server.controller';
import { UserPasswordController } from '../controllers/users/users.password.server.controller';
import { UserProfileController } from '../controllers/users/users.profile.server.controller';
import { UserPolicy } from '../policies/users.server.policy';

export class UsersRouter {
	private userProfileController = new UserProfileController();
	private userPasswordController = new UserPasswordController();
	private userAuthorizationController = new UserAuthorizationController();
	private userPolicy = new UserPolicy();

	public setupRoutes = app => {
		// Setting up the users profile api
		app.route('/api/users')
			.all(this.userPolicy.isAllowed)
			.put(this.userProfileController.update)
			.delete(this.userProfileController.removeSelf);

		app.route('/api/users/me')
			.all(this.userPolicy.isAllowed)
			.get(this.userProfileController.me);

		app.route('/api/users/password')
			.all(this.userPolicy.isAllowed)
			.post(this.userPasswordController.changePassword);

		app.route('/api/users/picture')
			.all(this.userPolicy.isAllowed)
			.post(this.userProfileController.changeProfilePicture);

		// Finish by binding the user middleware
		app.param('userId', this.userAuthorizationController.userByID);
	};
}
