'use strict';

/**
 * Module dependencies
 */
var profilesPolicy = require('../policies/profiles.server.policy'),
  profiles = require('../controllers/profiles.server.controller');

module.exports = function (app) {
  // Profiles collection routes
  app.route('/api/profiles').all(profilesPolicy.isAllowed)
    .get(profiles.list)
    .post(profiles.create);

  // Single profile routes
  app.route('/api/profiles/:profileId').all(profilesPolicy.isAllowed)
    .get(profiles.read)
    .put(profiles.update)
    .delete(profiles.delete);

  app.route('/api/my/profiles').all(profilesPolicy.isAllowed)
    .get(profiles.my);

  // Finish by binding the profile middleware
  app.param('profileId', profiles.profileByID);
};
