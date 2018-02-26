'use strict';

/**
 * Module dependencies
 */
var superbasicsPolicy = require ('../policies/superbasics.server.policy'),
	superbasics       = require ('../controllers/superbasics.server.controller');

module.exports = function (app) {
	app.route ('/api/superbasics')
		.all (superbasicsPolicy.isAllowed)
		.get (superbasics.list)
		.post (superbasics.create);
	app.route ('/api/superbasics/:superbasicId')
		.all (superbasicsPolicy.isAllowed)
		.get (superbasics.read)
		.put (superbasics.update)
		.delete (superbasics.delete);
	app.param ('superbasicId', superbasics.superbasicByID);
};
