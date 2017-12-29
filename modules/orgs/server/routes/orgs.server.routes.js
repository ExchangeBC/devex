'use strict';

/**
 * Module dependencies
 */
var orgsPolicy = require('../policies/orgs.server.policy'),
	orgs = require('../controllers/orgs.server.controller');

module.exports = function (app) {
	// Orgs collection routes
	app.route('/api/orgs').all(orgsPolicy.isAllowed)
		.get(orgs.list)
		.post(orgs.create);

	// Single org routes
	app.route('/api/orgs/:orgId').all(orgsPolicy.isAllowed)
		.get(orgs.read)
		.put(orgs.update)
		.delete(orgs.delete);

	app.route('/api/upload/logo/org/:orgId')
		.all (orgsPolicy.isAllowed)
		.post (orgs.logo);

	app.route ('/api/orgs/:orgId/user/:userId/remove')
		.all (orgsPolicy.isAllowed)
		.get (orgs.removeUserFromMemberList);

	// Finish by binding the org middleware
	app.param('orgId', orgs.orgByID);
};
