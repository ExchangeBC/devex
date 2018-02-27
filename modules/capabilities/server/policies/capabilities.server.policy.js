'use strict';

/**
 * Module dependencies
 */
var acl     = require ('acl');
var helpers = require ((require ('path')).resolve ('./modules/core/server/controllers/core.server.helpers'));

// Using the memory backend
acl = new acl (new acl.memoryBackend ());


/**
 * Invoke Capabilities Permissions
 */
exports.invokeRolesPolicies = function () {
	acl.allow ([
	{
		roles: ['admin'],
		allows: [{
			resources: '/api/capabilities',
			permissions: '*'
		}, {
			resources: '/api/capabilities/:capabilityId',
			permissions: '*'
		}, {
			resources: '/api/capabilityskill',
			permissions: '*'
		}, {
			resources: '/api/capabilityskill/:capabilityskillId',
			permissions: '*'
		}]
	},
	{
		roles: ['gov'],
		allows: [{
			resources: '/api/capabilities',
			permissions: ['get']
		}, {
			resources: '/api/capabilities/:capabilityId',
			permissions: ['get']
		}, {
			resources: '/api/capabilityskill',
			permissions: ['post']
		}, {
			resources: '/api/capabilityskill/:capabilityskillId',
			permissions: ['get', 'put', 'delete']
		}]
	},
	{
		roles: ['user'],
		allows: [{
			resources: '/api/capabilities',
			permissions: ['get']
		}, {
			resources: '/api/capabilities/:capabilityId',
			permissions: ['get']
		}, {
			resources: '/api/capabilityskill',
			permissions: '*'
		}, {
			resources: '/api/capabilityskill/:capabilityskillId',
			permissions: '*'
		}]
	},
	{
		roles: ['guest'],
		allows: [{
			resources: '/api/capabilities',
			permissions: ['get']
		}, {
			resources: '/api/capabilities/:capabilityId',
			permissions: ['get']
		}]
	}
	]);
};

/**
 * Check If Capabilities Policy Allows
 */
exports.isAllowed = function (req, res, next) {
	var roles = (req.user) ? req.user.roles : ['guest'];

	// Check for user roles
	acl.areAnyRolesAllowed (roles, req.route.path, req.method.toLowerCase (), function (err, isAllowed) {
		if (err) {
			// An authorization error occurred
			return res.status (500).send ('Unexpected authorization error');
		} else {
			if (isAllowed) {
				// Access granted! Invoke next middleware
				return next ();
			} else {
				return res.status (403).json ({
					message: 'User is not authorized'
				});
			}
		}
	});
};
