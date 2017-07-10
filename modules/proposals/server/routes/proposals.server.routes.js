'use strict';

/**
 * Module dependencies
 */
var proposalsPolicy = require('../policies/proposals.server.policy'),
  proposals = require('../controllers/proposals.server.controller');

module.exports = function(app) {
  // Proposals Routes
  app.route('/api/proposals').all(proposalsPolicy.isAllowed)
    .get(proposals.list)
    .post(proposals.create);

  app.route('/api/proposals/:proposalId').all(proposalsPolicy.isAllowed)
    .get(proposals.read)
    .put(proposals.update)
    .delete(proposals.delete);

  app.route('/api/submit/proposal/:proposalId').all(proposalsPolicy.isAllowed)
    .put(proposals.submit);
  //
  // proposals for opportunity
  //
  app.route('/api/proposals/for/opportunity/:opportunityId')
    .get(proposals.forOpportunity);


  app.route('/api/my/proposals').all(proposalsPolicy.isAllowed)
    .get(proposals.my);
  app.route('/api/myopp/proposal/:opportunityId').all(proposalsPolicy.isAllowed)
    .get(proposals.myopp);


    app.route ('/api/proposal/:proposalId/upload/doc')
      // .all (proposalsPolicy.isAllowed)
      .post (proposals.uploaddoc);
    app.route ('/api/proposal/:proposalId/remove/doc/:documentId')
      // .all (proposalsPolicy.isAllowed)
      .get (proposals.removedoc);

  //
  // get lists of users
  //
  app.route('/api/proposals/members/:proposalId')
    // .all(proposalsPolicy.isAllowed)
    .get(proposals.listMembers);
  app.route('/api/proposals/requests/:proposalId')
    .all(proposalsPolicy.isAllowed)
    .get(proposals.listRequests);

  //
  // modify users
  //
  app.route('/api/proposals/requests/confirm/:proposalId/:userId')
    .all(proposalsPolicy.isAllowed)
    .get(proposals.confirmMember);
  app.route('/api/proposals/requests/deny/:proposalId/:userId')
    .all(proposalsPolicy.isAllowed)
    .get(proposals.denyMember);

  app.route('/api/new/proposal')
    // .all(proposalsPolicy.isAllowed)
    .get(proposals.new);

  app.route('/api/request/proposal/:proposalId')
    .get(proposals.request)

  // Finish by binding the Proposal middleware
  app.param('proposalId', proposals.proposalByID);
};
