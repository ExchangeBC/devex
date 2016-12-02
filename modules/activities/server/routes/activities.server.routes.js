'use strict';

/**
 * Module dependencies
 */
var activitiesPolicy = require('../policies/activities.server.policy'),
	activities = require('../controllers/activities.server.controller');

module.exports = function (app) {
	// Activities collection routes
	app.route('/api/activities').all(activitiesPolicy.isAllowed)
		.get(activities.list)
		.post(activities.create);

	// Single activity routes
	app.route('/api/activities/:activityId').all(activitiesPolicy.isAllowed)
		.get(activities.read)
		.put(activities.update)
		.delete(activities.delete);

	//
	// projects for program
	//
	app.route('/api/activities/for/program/:programId')
		.get(activities.forProgram);

	//
	// get lists of users
	//
	app.route('/api/activities/members/:activityId')
		// .all(activitiesPolicy.isAllowed)
		.get(activities.listMembers);
	app.route('/api/activities/requests/:activityId')
		.all(activitiesPolicy.isAllowed)
		.get(activities.listRequests);

	//
	// modify users
	//
	app.route('/api/activities/requests/confirm/:activityId/:userId')
		.all(activitiesPolicy.isAllowed)
		.get(activities.confirmMember);
	app.route('/api/activities/requests/deny/:activityId/:userId')
		.all(activitiesPolicy.isAllowed)
		.get(activities.denyMember);

	app.route('/api/new/activity')
		// .all(activitiesPolicy.isAllowed)
		.get(activities.new);

	app.route('/api/request/activity/:activityId')
		.get(activities.request)

	// Finish by binding the activity middleware
	app.param('activityId', activities.activityByID);
};
