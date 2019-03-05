'use strict';

import UserAuthorizationController from '../controllers/users/UserAuthorizationController';
import UserPasswordController from '../controllers/users/UserPasswordController';
import UserProfileController from '../controllers/users/UserProfileController';
import UserPolicy from '../policies/UserPolicy';

class UsersRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: UsersRouter;

	private constructor() {
		UserPolicy.invokeRolesPolicies();

		this.setupRoutes = this.setupRoutes.bind(this);
	}

	public setupRoutes(app) {
		// Setting up the users profile api
		app.route('/api/users')
			.all(UserPolicy.isAllowed)
			.put(UserProfileController.update)
			.delete(UserProfileController.removeSelf);

		app.route('/api/users/me')
			.all(UserPolicy.isAllowed)
			.get(UserProfileController.me);

		app.route('/api/users/password')
			.all(UserPolicy.isAllowed)
			.post(UserPasswordController.changePassword);

		app.route('/api/users/picture')
			.all(UserPolicy.isAllowed)
			.post(UserProfileController.changeProfilePicture);

		app.route('/api/users/registration')
			.all(UserPolicy.isAllowed)
			.get(UserProfileController.newsletterSubscriptionStatus);

		// Finish by binding the user middleware
		app.param('userId', UserAuthorizationController.userByID);
	};
}

export default UsersRouter.getInstance();
