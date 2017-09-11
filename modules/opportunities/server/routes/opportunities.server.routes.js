'use strict';

/**
 * Module dependencies
 */
var opportunitiesPolicy = require('../policies/opportunities.server.policy'),
  opportunities = require('../controllers/opportunities.server.controller');

module.exports = function(app) {
  // Opportunities Routes
  app.route('/api/opportunities').all(opportunitiesPolicy.isAllowed)
    .get(opportunities.list)
    .post(opportunities.create);

  app.route('/api/opportunities/:opportunityId').all(opportunitiesPolicy.isAllowed)
    .get(opportunities.read)
    .put(opportunities.update)
    .delete(opportunities.delete);


  app.route('/api/my/opportunities').all(opportunitiesPolicy.isAllowed)
    .get(opportunities.my);

  //
  // opportunities for project
  //
  app.route('/api/opportunities/for/project/:projectId')
    .get(opportunities.forProject);
  app.route('/api/opportunities/for/program/:programId')
    .get(opportunities.forProgram);

  //
  // get lists of users
  //
  app.route('/api/opportunities/members/:opportunityId')
    .get(opportunities.listMembers);
  app.route('/api/opportunities/requests/:opportunityId')
    .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.listRequests);
  app.route('/api/opportunities/publish/:opportunityId')
    .all(opportunitiesPolicy.isAllowed)
    .get(opportunities.publish)
    .delete(opportunities.unpublish);
  //
  // unassign the assigned proposal
  //
  app.route('/api/opportunities/unassign/:opportunityId')
    .all(opportunitiesPolicy.isAllowed)
    .put(opportunities.unassign);

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
    .get(opportunities.new);

  app.route('/api/request/opportunity/:opportunityId')
    .get(opportunities.request)


  // Finish by binding the Opportunity middleware
  app.param('opportunityId', opportunities.opportunityByID);
};
