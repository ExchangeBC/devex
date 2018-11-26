'use strict';

import * as admin from '../controllers/admin.server.controller';
import { AdminPolicy } from '../policies/admin.server.policy';
import { AuthRouter } from './auth.server.routes';
import { UsersRouter } from './users.server.routes';

export class AdminRouter {
	private adminPolicy = new AdminPolicy();

	public setupRoutes = app => {
		// Set up auth and user routes
		const authRouter = new AuthRouter();
		authRouter.setupRoutes(app);

		const usersRouter = new UsersRouter();
		usersRouter.setupRoutes(app);

		// Users collection routes
		app.route('/api/users').get(this.adminPolicy.isAllowed, admin.list);

		app.route('/api/listopps').get(this.adminPolicy.isAllowed, admin.notifyOpportunities);
		app.route('/api/listmeets').get(this.adminPolicy.isAllowed, admin.notifyMeetings);

		// Gov. Request
		app.route('/api/approve').post(this.adminPolicy.isAllowed, admin.approve);

		// Single user routes
		app.route('/api/users/:userId')
			.get(this.adminPolicy.isAllowed, admin.read)
			.put(this.adminPolicy.isAllowed, admin.update)
			.delete(this.adminPolicy.isAllowed, admin.delete);

		// Finish by binding the user middleware
		app.param('userId', admin.userByID);
	};
}
