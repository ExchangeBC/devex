'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Skills Permissions
 */
exports.invokeRolesPolicies = function () {
	acl.allow([{
		roles: ['admin','gov'],
		allows: [{
			resources: '/api/skills',
			permissions: '*'
		}, {
			resources: '/api/skills/object/list',
			permissions: '*'
		}, {
			resources: '/api/skills/:skillId',
			permissions: '*'
		}]
	}, {
		roles: ['user', 'guest'],
		allows: [{
			resources: '/api/skills',
			permissions: ['get']
		}, {
			resources: '/api/skills/object/list',
			permissions: ['get']
		}, {
			resources: '/api/skills/:skillId',
			permissions: ['get']
		}]
	}]);
};

/**
 * Check If Skills Policy Allows
 */
exports.isAllowed = function (req, res, next) {
	var roles = (req.user) ? req.user.roles : ['guest'];

	// Check for user roles
	acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
		if (err) {
			// An authorization error occurred
			return res.status(500).send('Unexpected authorization error');
		} else {
			if (isAllowed) {
				// Access granted! Invoke next middleware
				return next();
			} else {
				return res.status(403).json({
					message: 'User is not authorized'
				});
			}
		}
	});
};
