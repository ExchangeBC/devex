'use strict';

import OpportunitiesController from '../controllers/opportunities.server.controller';
import { OpportunitiesPolicy } from '../policies/opportunities.server.policy';

export class OpportunitiesRouter {
	private opportunitiesPolicy: OpportunitiesPolicy = new OpportunitiesPolicy();

	public setupRoutes = app => {

		// Routes for opportunity CRUD operations
		app.route('/api/opportunities')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.list)
			.post(OpportunitiesController.create);

		app.route('/api/opportunities/:opportunityId')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.read)
			.put(OpportunitiesController.update)
			.delete(OpportunitiesController.delete);

		// Routes for publishing or unpublishing opportunities
		app.route('/api/opportunities/:opportunityId/publish')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.publish);

		app.route('/api/opportunities/:opportunityId/unpublish')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.unpublish);

		// Routes for assigning or unassigning proposals to opportunity
		app.route('/api/opportunities/:opportunityId/assign/:proposalId')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.assign);

		app.route('/api/opportunities/:opportunityId/unassign/:proposalId')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.unassign);

		// Get proposal statistics for a given opportunity
		app.route('/api/opportunities/:opportunityId/proposalStats')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.getProposalStats);

		// Get a proposal archive including all proposals for the given opportunity
		app.route('/api/opportunities/:opportunityId/proposalArchive')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.getProposalArchive);

		// Get a proposal archive for a single proposal for the given opportunity and given user
		app.route('/api/opportunities/:opportunityId/myProposalArchive')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.getMyProposalArchive);

		// Routes for users to watch or unwatch opportunities
		app.route('/api/opportunities/:opportunityId/watch/add')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.addWatch);

		app.route('/api/opportunities/:opportunityId/watch/remove')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.removeWatch);

		// Route for querying the status of an opportunity
		app.route('/api/opportunities/:opportunityId/deadline/status')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(OpportunitiesController.deadlineStatus);

		// Route for initiating a 2FA code being sent to approval authority
		app.route('/api/opportunities/:opportunityId/sendcode')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(OpportunitiesController.send2FA);

		// Route for actioning a pre-approval or approval request via a POST operation
		app.route('/api/opportunities/:opportunityId/action')
			.all(this.opportunitiesPolicy.isAllowed)
			.post(OpportunitiesController.action);

		// Finish by binding the Opportunity middleware
		app.param(
			'opportunityId',
			OpportunitiesController.opportunityByID
		);
	}
}
