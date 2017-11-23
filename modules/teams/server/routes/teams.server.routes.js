'use strict';

/**
 * Module dependencies
 */
var teamsPolicy = require('../policies/teams.server.policy'),
  teams = require('../controllers/teams.server.controller');

module.exports = function(app) {
  // Teams Routes
  app.route('/api/teams').all(teamsPolicy.isAllowed)
    .get(teams.list)
    .post(teams.create);

  app.route('/api/teams/:teamId').all(teamsPolicy.isAllowed)
    .get(teams.read)
    .put(teams.update)
    .delete(teams.delete);


  app.route('/api/my/teams').all(teamsPolicy.isAllowed)
    .get(teams.my);
  app.route('/api/myadmin/teams').all(teamsPolicy.isAllowed)
    .get(teams.myadmin);

  //
  // teams for program
  //
  app.route('/api/teams/for/org/:orgId')
    .get(teams.forOrg);

  //
  // get lists of users
  //
  app.route('/api/teams/members/:teamId')
    .get(teams.listMembers);
  app.route('/api/teams/requests/:teamId')
    .all(teamsPolicy.isAllowed)
    .get(teams.listRequests);

  //
  // modify users
  //
  app.route('/api/teams/requests/confirm/:teamId/:userId')
    .all(teamsPolicy.isAllowed)
    .get(teams.confirmMember);
  app.route('/api/teams/requests/deny/:teamId/:userId')
    .all(teamsPolicy.isAllowed)
    .get(teams.denyMember);

  app.route('/api/new/team')
    .get(teams.new);

  app.route('/api/request/team/:teamId')
    .get(teams.request)

  // Finish by binding the Team middleware
  app.param('teamId', teams.teamByID);
};
