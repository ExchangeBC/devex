'use strict';

import ProposalsServerController from '../controllers/ProposalsServerController';
import ProposalsPolicy from '../policies/ProposalsPolicy';

class ProposalsRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProposalsRouter;

	private constructor() {
		ProposalsPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Proposals Routes
		app.route('/api/proposals')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.list)
			.post(ProposalsServerController.create);

		// Retrieving and updating proposals
		app.route('/api/proposals/:proposalId')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.read)
			.put(ProposalsServerController.update)
			.delete(ProposalsServerController.delete);

		// Submitting a proposal
		app.route('/api/proposals/:proposalId/submit')
			.all(ProposalsPolicy.isAllowed)
			.put(ProposalsServerController.submit);

		// Assignment of CWU proposals to individual
		app.route('/api/proposals/:proposalId/assigncwu')
			.all(ProposalsPolicy.isAllowed)
			.put(ProposalsServerController.assign);

		// Assignment of SWU proposals to organization
		app.route('/api/proposals/:proposalId/assignswu')
			.all(ProposalsPolicy.isAllowed)
			.put(ProposalsServerController.assignswu);

		app.route('/api/proposals/:proposalId/unassignswu')
			.all(ProposalsPolicy.isAllowed)
			.put(ProposalsServerController.unassignswu);

		// Potential resources that match up to opportunity requirements
		app.route('/api/proposals/resources/opportunity/:opportunityId/org/:orgSmallId')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.getPotentialResources);

		// Retrieve a proposal for a user and opportunity combination
		app.route('/api/proposals/my/:opportunityId')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.getUserProposalForOpp);

		// Retrieve all proposals submitted for a given opportunity
		app.route('/api/proposals/for/:opportunityId')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.getProposalsForOpp);

		// Upload attachment on proposal
		app.route('/api/proposals/:proposalId/documents')
			.all(ProposalsPolicy.isAllowed)
			.post(ProposalsServerController.uploaddoc);

		// Retrieve or delete attachment on proposal
		app.route('/api/proposals/:proposalId/documents/:documentId')
			.all(ProposalsPolicy.isAllowed)
			.get(ProposalsServerController.downloaddoc)
			.delete(ProposalsServerController.removedoc);

		// Finish by binding the Proposal middleware
		app.param('proposalId', ProposalsServerController.proposalByID);
	};
}

export default ProposalsRouter.getInstance();
