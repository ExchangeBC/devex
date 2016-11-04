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

	//
	// get lists of users
	//
	app.route('/api/programs/members/:programId')
		// .all(programsPolicy.isAllowed)
		.get(programs.listMembers);
	app.route('/api/programs/requests/:programId')
		.all(programsPolicy.isAllowed)
		.get(programs.listRequests);

	app.route('/api/new/program')
		// .all(programsPolicy.isAllowed)
		.get(programs.new);

	// Finish by binding the program middleware
	app.param('programId', programs.programByID);
};
