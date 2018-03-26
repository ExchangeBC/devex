'use strict';

/**
 * Module dependencies
 */
var capabilitiesPolicy = require ('../policies/capabilities.server.policy'),
	capabilities       = require ('../controllers/capabilities.server.controller');

module.exports = function (app) {
	app.route ('/api/capabilities')
		.all (capabilitiesPolicy.isAllowed)
		.get (capabilities.list)
		.post (capabilities.create);
	app.route ('/api/capabilities/:capabilityId')
		.all (capabilitiesPolicy.isAllowed)
		.get (capabilities.read)
		.put (capabilities.update)
		.delete (capabilities.delete);
	app.route ('/api/capabilityskill')
		.all (capabilitiesPolicy.isAllowed)
		.post (capabilities.skillCreate);
	app.route ('/api/capabilityskill/:capabilityskillId')
		.all (capabilitiesPolicy.isAllowed)
		.put (capabilities.skillUpdate)
		.delete (capabilities.skillDelete);
	app.param ('capabilityId', capabilities.capabilityByID);
	app.param ('capabilityskillId', capabilities.capabilitySkillByID);
};
