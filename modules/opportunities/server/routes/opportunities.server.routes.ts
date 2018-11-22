'use strict';

import { OpportunitiesController } from '../controllers/opportunities.server.controller';
import { OpportunitiesPolicy } from '../policies/opportunities.server.policy';

export class OpportunitiesRouter {
	private opportunitiesPolicy: OpportunitiesPolicy = new OpportunitiesPolicy();
	private opportunitiesController: OpportunitiesController = new OpportunitiesController();

	constructor(app) {
		this.init(app);
	}

	private init = app => {

		// Routes for opportunity CRUD operations
		app.route('/api/opportunities')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.list)
			.post(this.opportunitiesController.create);

		app.route('/api/opportunities/:opportunityId')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.read)
			.put(this.opportunitiesController.update)
			.delete(this.opportunitiesController.delete);

		// Routes for publishing or unpublishing opportunities
		app.route('/api/opportunities/:opportunityId/publish')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.publish);

		app.route('/api/opportunities/:opportunityId/unpublish')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.unpublish);

		// Routes for assigning or unassigning proposals to opportunity
		app.route('/api/opportunities/:opportunityId/assign/:proposalId')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.assign);

		app.route('/api/opportunities/:opportunityId/unassign/:proposalId')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.unassign);

		// Get proposals for a given opportunity
		app.route('/api/opportunities/:opportunityId/proposals')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.getProposals);

		// Get proposal statistics for a given opportunity
		app.route('/api/opportunities/:opportunityId/proposalStats')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.getProposalStats);

		// Get a proposal archive including all proposals for the given opportunity
		app.route('/api/opportunities/:opportunityId/proposalArchive')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.getProposalArchive);

		// Get a proposal archive for a single proposal for the given opportunity and given user
		app.route('/api/opportunities/:opportunityId/myProposalArchive')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.getMyProposalArchive);

		// Routes for users to watch or unwatch opportunities
		app.route('/api/opportunities/:opportunityId/watch/add')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.addWatch);

		app.route('/api/opportunities/:opportunityId/watch/remove')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.removeWatch);

		// Route for querying the status of an opportunity
		app.route('/api/opportunities/:opportunityId/deadline/status')
			.all(this.opportunitiesPolicy.isAllowed)
			.get(this.opportunitiesController.deadlineStatus);

		// Route for initiating a 2FA code being sent to approval authority
		app.route('/api/opportunities/:opportunityId/sendcode')
			.all(this.opportunitiesPolicy.isAllowed)
			.put(this.opportunitiesController.send2FA);

		// Route for actioning a pre-approval or approval request via a POST operation
		app.route('/api/opportunities/:opportunityId/action')
			.all(this.opportunitiesPolicy.isAllowed)
			.post(this.opportunitiesController.action);

		// Finish by binding the Opportunity middleware
		app.param(
			'opportunityId',
			this.opportunitiesController.opportunityByID
		);
	}
}
