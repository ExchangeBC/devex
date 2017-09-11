'use strict';

/**
 * Module dependencies
 */
var programsPolicy = require('../policies/programs.server.policy'),
  programs = require('../controllers/programs.server.controller');

module.exports = function (app) {
  // Programs collection routes
  app.route('/api/programs').all(programsPolicy.isAllowed)
    .get(programs.list)
    .post(programs.create);

  // Single program routes
  app.route('/api/programs/:programId').all(programsPolicy.isAllowed)
    .get(programs.read)
    .put(programs.update)
    .delete(programs.delete);

  app.route('/api/my/programs').all(programsPolicy.isAllowed)
    .get(programs.my);
  app.route('/api/myadmin/programs').all(programsPolicy.isAllowed)
    .get(programs.myadmin);

  //
  // get lists of users
  //
  app.route('/api/programs/members/:programId')
    .get(programs.listMembers);
  app.route('/api/programs/requests/:programId')
    .all(programsPolicy.isAllowed)
    .get(programs.listRequests);

  //
  // modify users
  //
  app.route('/api/programs/requests/confirm/:programId/:userId')
    .all(programsPolicy.isAllowed)
    .get(programs.confirmMember);
  app.route('/api/programs/requests/deny/:programId/:userId')
    .all(programsPolicy.isAllowed)
    .get(programs.denyMember);

  app.route('/api/new/program')
    .get(programs.new);

  app.route('/api/request/program/:programId')
    .get(programs.request);

  //
  // upload logo
  //
  app.route('/api/upload/logo/program/:programId')
    .all (programsPolicy.isAllowed)
    .post (programs.logo);

  // Finish by binding the program middleware
  app.param('programId', programs.programByID);
};
