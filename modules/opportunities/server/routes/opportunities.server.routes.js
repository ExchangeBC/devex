'use strict';

/**
 * Module dependencies
 */
var opportunitiesPolicy = require('../policies/opportunities.server.policy'),
  opportunities = require('../controllers/opportunities.server.controller');

module.exports = function (app) {
  // Opportunities collection routes
  app.route('/api/opportunities').all(opportunitiesPolicy.isAllowed)
    .get(opportunities.list)
    .post(opportunities.create);

  // Single opportunity routes
  app.route('/api/opportunities/:opportunityId').all(opportunitiesPolicy.isAllowed)
    .get(opportunities.read)
    .put(opportunities.update)
    .delete(opportunities.delete);

  //
  // get lists of users
  //
  app.route('/api/opportunities/members/:opportunityId')
    // .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.listMembers);
  app.route('/api/opportunities/requests/:opportunityId')
    .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.listRequests);

  //
  // modify users
  //
  app.route('/api/opportunities/requests/confirm/:opportunityId/:userId')
    .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.confirmMember);
  app.route('/api/opportunities/requests/deny/:opportunityId/:userId')
    .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.denyMember);

  app.route('/api/new/opportunity')
    // .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.new);

  app.route('/api/request/opportunity/:opportunityId')
    .get(opportunities.request)

  // Finish by binding the opportunity middleware
  app.param('opportunityId', opportunities.opportunityByID);
};
