'use strict';

import OrgsServerController from '../controllers/OrgsServerController';
import OrgsPolicy from '../policies/OrgsPolicy';

class OrgsRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OrgsRouter;

	private constructor() {
		OrgsPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Get a list of all orgs
		app.route('/api/orgs')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.list)
			.post(OrgsServerController.create);

		// Get a filtered and paginated list of orgs
		app.route('/api/orgs/filter')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.filter)

		// Get a list of orgs that the user is a member of
		app.route('/api/orgs/my')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.my);

		// Get a list of orgs that the user is an admin of
		app.route('/api/orgs/myadmin')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.myadmin);

		// Get a single org
		app.route('/api/orgs/:orgId')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.read)
			.put(OrgsServerController.update)
			.delete(OrgsServerController.delete);

		app.route('/api/org/:orgId/upload/logo')
			.all(OrgsPolicy.isAllowed)
			.post(OrgsServerController.logo);

		app.route('/api/orgs/:orgId/user/:userId/remove')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.removeUserFromMemberList);

		app.route('/api/orgs/:orgId/removeMeFromCompany')
			.all(OrgsPolicy.isAllowed)
			.get(OrgsServerController.removeMeFromCompany);

		app.route('/api/orgs/:orgId/joinRequest')
			.all(OrgsPolicy.isAllowed)
			.put(OrgsServerController.joinRequest);

		app.route('/api/orgs/:orgId/acceptRequest/:userId')
			.all(OrgsPolicy.isAllowed)
			.put(OrgsServerController.acceptRequest);

		app.route('/api/orgs/:orgId/declineRequest/:userId')
			.all(OrgsPolicy.isAllowed)
			.put(OrgsServerController.declineRequest);

		// Finish by binding the org middleware
		app.param('orgId', OrgsServerController.orgByID);
		app.param('orgSmallId', OrgsServerController.orgByIDSmall);
	};
}

export default OrgsRouter.getInstance();
