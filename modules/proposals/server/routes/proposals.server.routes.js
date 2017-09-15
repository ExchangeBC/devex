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
    app.route('/api/assign/proposal/:proposalId').all(proposalsPolicy.isAllowed)
      .put(proposals.assign);
    //
    // proposals for opportunity
    //
    app.route('/api/proposals/for/opportunity/:opportunityId')
      .get(proposals.forOpportunity);


    app.route('/api/my/proposals').all(proposalsPolicy.isAllowed)
      .get(proposals.my);
    app.route('/api/myopp/proposal/:opportunityId').all(proposalsPolicy.isAllowed)
      .get(proposals.myopp);

    app.route ('/api/proposals/stats/opportunity/:opportunityId')
      .get (proposals.stats);

    app.route ('/api/proposal/:proposalId/upload/doc')
      .post (proposals.uploaddoc);
    app.route ('/api/proposal/:proposalId/remove/doc/:documentId')
      .get (proposals.removedoc);
    app.route ('/api/proposal/:proposalId/download/doc/:documentId')
      .get (proposals.downloaddoc);

    app.route ('/api/proposals/archive/opportunity/:opportunityId')
      .get (proposals.downloadArchive);

  app.route('/api/new/proposal')
    // .all(proposalsPolicy.isAllowed)
    .get(proposals.new);


  // Finish by binding the Proposal middleware
  app.param('proposalId', proposals.proposalByID);
};
