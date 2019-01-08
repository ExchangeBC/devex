'use strict';

import AdminServerController from '../controllers/AdminServerController';
import AdminPolicy from '../policies/AdminPolicy';
import AuthRouter from './AuthRouter';
import UserRouter from './UserRouter';

class AdminRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: AdminRouter;

	private constructor() {
		AdminPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Set up auth and user routes
		AuthRouter.setupRoutes(app);
		UserRouter.setupRoutes(app);

		// Users collection routes
		app.route('/api/users').get(AdminPolicy.isAllowed, AdminServerController.list);

		// Single user routes
		app.route('/api/users/:userId')
			.get(AdminPolicy.isAllowed, AdminServerController.read)
			.put(AdminPolicy.isAllowed, AdminServerController.update)
			.delete(AdminPolicy.isAllowed, AdminServerController.delete);

		// Finish by binding the user middleware
		app.param('userId', AdminServerController.userByID);
	};
}

export default AdminRouter.getInstance();
