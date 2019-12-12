'use strict';

import OpportunitiesServerController from '../controllers/OpportunitiesServerController';
import OpportunitiesPolicy from '../policies/OpportunitiesPolicy';

class OpportunitiesRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OpportunitiesRouter;

	private constructor() {
		OpportunitiesPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Routes for opportunity CRUD operations
		app.route('/api/opportunities')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.list)
			.post(OpportunitiesServerController.create);

		app.route('/api/opportunities/:opportunityId')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.read)
			.put(OpportunitiesServerController.update)
			.delete(OpportunitiesServerController.delete);

		// Routes for publishing or unpublishing opportunities
		app.route('/api/opportunities/:opportunityId/publish')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.publish);

		app.route('/api/opportunities/:opportunityId/unpublish')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.unpublish);

		// Routes for assigning or unassigning proposals to opportunity
		app.route('/api/opportunities/:opportunityId/assign/:proposalId')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.assign);

		app.route('/api/opportunities/:opportunityId/assignswu/:proposalId')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.assignswu);

		app.route('/api/opportunities/:opportunityId/unassign/:proposalId')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.unassign);

		// Get proposal statistics for a given opportunity
		app.route('/api/opportunities/:opportunityId/proposalStats')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.getProposalStats);

		// Get a proposal archive including all proposals for the given opportunity
		app.route('/api/opportunities/:opportunityId/proposalArchive')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.getProposalArchive);

		// Get a proposal archive for a single proposal for the given opportunity and given user
		app.route('/api/opportunities/:opportunityId/myProposalArchive')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.getMyProposalArchive);

		// Routes for users to watch or unwatch opportunities
		app.route('/api/opportunities/:opportunityId/watch/add')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.addWatch);

		app.route('/api/opportunities/:opportunityId/watch/remove')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.removeWatch);

		// Route for querying the status of an opportunity
		app.route('/api/opportunities/:opportunityId/deadline/status')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.deadlineStatus);

		// Route for initiating a 2FA code being sent to approval authority
		app.route('/api/opportunities/:opportunityId/sendcode')
			.all(OpportunitiesPolicy.isAllowed)
			.put(OpportunitiesServerController.send2FA);

		// Route for retrieving all opportunities associated with a program
		app.route('/api/opportunities/for/program/:programId')
			.all(OpportunitiesPolicy.isAllowed)
			.get(OpportunitiesServerController.forProgram);

		// Route for actioning a pre-approval or approval request via a POST operation
		app.route('/api/opportunities/:opportunityId/action')
			.all(OpportunitiesPolicy.isAllowed)
			.post(OpportunitiesServerController.action);

		// Finish by binding the Opportunity middleware
		app.param('opportunityId', OpportunitiesServerController.opportunityByID);
	};
}

export default OpportunitiesRouter.getInstance();
