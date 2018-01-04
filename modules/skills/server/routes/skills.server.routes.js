'use strict';

/**
 * Module dependencies
 */
var skillsPolicy = require('../policies/skills.server.policy'),
	skills = require('../controllers/skills.server.controller');

module.exports = function(app) {
	// Skills Routes
	app.route('/api/skills').all(skillsPolicy.isAllowed)
		.get(skills.list);

	app.route('/api/skills/:skillId').all(skillsPolicy.isAllowed)
		.get(skills.read)
		.put(skills.update);

	app.route('/api/skills/object/list').all(skillsPolicy.isAllowed)
		.get(skills.objectlist);

	// Finish by binding the Skill middleware
	app.param('skillId', skills.skillByID);
};
