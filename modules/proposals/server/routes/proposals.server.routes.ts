'use strict';

import ProposalsServerController from '../controllers/ProposalsServerController';
import * as proposalsPolicy from '../policies/proposals.server.policy';

module.exports = (app) => {

	// Proposals Routes
	app.route('/api/proposals')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.list)
		.post(ProposalsServerController.create);

	// Retrieving and updating proposals
	app.route('/api/proposals/:proposalId')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.read)
		.put(ProposalsServerController.update)
		.delete(ProposalsServerController.delete);

	// Assignment of CWU proposals to individual
	app.route('/api/proposals/:proposalId/assignmentStatus')
		.all(proposalsPolicy.isAllowed)
		.put(ProposalsServerController.assign);

	// Assignment of SWU proposals to organization
	app.route('/api/proposalsSWU/:proposalId/assignmentStatus')
		.all(proposalsPolicy.isAllowed)
		.put(ProposalsServerController.assignswu);

	// Potential resources that match up to opportunity requirements
	app.route('/api/proposals/resources/opportunity/:opportunityId/org/:orgSmallId')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.getPotentialResources);

	// Retrieve a proposal for a user and opportunity combination
	app.route('/api/proposals/my/:opportunityId')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.getUserProposalForOpp);

	// Retrieve all proposals submitted for a given opportunity
	app.route('/api/proposals/for/:opportunityId')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.getProposalsForOpp);

	// Upload attachment on proposal
	app.route('/api/proposals/:proposalId/documents')
		.all(proposalsPolicy.isAllowed)
		.post(ProposalsServerController.uploaddoc);

	// Retrieve or delete attachment on proposal
	app.route('/api/proposals/:proposalId/documents/:documentId')
		.all(proposalsPolicy.isAllowed)
		.get(ProposalsServerController.downloaddoc)
		.delete(ProposalsServerController.removedoc);

	// Finish by binding the Proposal middleware
	app.param('proposalId', ProposalsServerController.proposalByID);
};
