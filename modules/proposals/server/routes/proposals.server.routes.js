'use strict';

/**
 * Module dependencies
 */
var proposalsPolicy = require('../policies/proposals.server.policy'),
	proposals = require('../controllers/proposals.server.controller');

module.exports = function(app) {
	// Proposals Routes
	app.route('/api/proposals')
		.all(proposalsPolicy.isAllowed)
		.get(proposals.list)
		.post(proposals.create);

	// Retrieving and updating proposals
	app.route('/api/proposals/:proposalId')
		.all(proposalsPolicy.isAllowed)
		.get(proposals.read)
		.put(proposals.update)
		.delete(proposals.delete);

	// Assignment of CWU proposals to individual
	app.route('/api/proposals/:proposalId/assignmentStatus')
		.all(proposalsPolicy.isAllowed)
		.put(proposals.assign);

	// Assignment of SWU proposals to organization
	app.route('/api/proposalsSWU/:proposalId/assignmentStatus')
		.all(proposalsPolicy.isAllowed)
		.put(proposals.assignswu);

	// Potential resources that match up to opportunity requirements
	app.route('/api/proposals/resources/opportunity/:opportunityId/org/:orgSmallId')
		.all(proposalsPolicy.isAllowed)
		.get(proposals.getPotentialResources);

	// Retrieve a proposal for a user and opportunity combination
	app.route('/api/proposals/my/:opportunityId')
		.all(proposalsPolicy.isAllowed)
		.get(proposals.getUserProposalForOpp);

	// Upload attachment on proposal
	app.route('/api/proposals/:proposalId/documents')
		.all(proposalsPolicy.isAllowed)
		.post(proposals.uploaddoc);

	// Retrieve or delete attachment on proposal
	app.route('/api/proposals/:proposalId/documents/:documentId')
		.all(proposalsPolicy.isAllowed)
		.get(proposals.downloaddoc)
		.delete(proposals.removedoc);

	// Finish by binding the Proposal middleware
	app.param('proposalId', proposals.proposalByID);
};
