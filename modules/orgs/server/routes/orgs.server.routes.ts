'use strict';

import { OrgsController } from '../controllers/orgs.server.controller';
import { OrgsPolicy } from '../policies/orgs.server.policy';

export class OrgsRouter {
	private orgsController = new OrgsController();
	private orgsPolicy = new OrgsPolicy();

	public setupRoutes = app => {
		// Get a list of all orgs
		app.route('/api/orgs')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.list)
			.post(this.orgsController.create);

		// Get a list of orgs that the user is a member of
		app.route('/api/orgs/my')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.my);

		// Get a list of orgs that the user is an admin of
		app.route('/api/orgs/myadmin')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.myadmin);

		// Get a single org
		app.route('/api/orgs/:orgId')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.read)
			.put(this.orgsController.update)
			.delete(this.orgsController.delete);

		app.route('/api/org/:orgId/upload/logo')
			.all(this.orgsPolicy.isAllowed)
			.post(this.orgsController.logo);

		app.route('/api/orgs/:orgId/user/:userId/remove')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.removeUserFromMemberList);

		app.route('/api/orgs/:orgId/removeMeFromCompany')
			.all(this.orgsPolicy.isAllowed)
			.get(this.orgsController.removeMeFromCompany);

		// Finish by binding the org middleware
		app.param('orgId', this.orgsController.orgByID);
		app.param('orgSmallId', this.orgsController.orgByIDSmall);
	};
}
