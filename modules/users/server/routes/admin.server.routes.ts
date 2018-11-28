'use strict';

import { AdminController } from '../controllers/admin.server.controller';
import { AdminPolicy } from '../policies/admin.server.policy';
import { AuthRouter } from './auth.server.routes';
import { UsersRouter } from './users.server.routes';

export class AdminRouter {
	private adminPolicy = new AdminPolicy();
	private adminController = new AdminController();

	public setupRoutes = app => {
		// Set up auth and user routes
		const authRouter = new AuthRouter();
		authRouter.setupRoutes(app);

		const usersRouter = new UsersRouter();
		usersRouter.setupRoutes(app);

		// Users collection routes
		app.route('/api/users').get(this.adminPolicy.isAllowed, this.adminController.list);

		// Single user routes
		app.route('/api/users/:userId')
			.get(this.adminPolicy.isAllowed, this.adminController.read)
			.put(this.adminPolicy.isAllowed, this.adminController.update)
			.delete(this.adminPolicy.isAllowed, this.adminController.delete);

		// Finish by binding the user middleware
		app.param('userId', this.adminController.userByID);
	};
}
