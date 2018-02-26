'use strict';

/**
 * Module dependencies
 */
var acl     = require ('acl');
var helpers = require ((require ('path')).resolve ('./modules/core/server/controllers/core.server.helpers'));

// Using the memory backend
acl = new acl (new acl.memoryBackend ());


/**
 * Invoke Superbasics Permissions
 */
exports.invokeRolesPolicies = function () {
	acl.allow ([{
		roles: ['admin','gov'],
		allows: [{
			resources: '/api/superbasics',
			permissions: '*'
		}, {
			resources: '/api/superbasics/:superbasicId',
			permissions: '*'
		}]
	}, {
		roles: ['user'],
		allows: [{
			resources: '/api/superbasics',
			permissions: ['get']
		}, {
			resources: '/api/superbasics/:superbasicId',
			permissions: ['get']
		}]
	}, {
		roles: ['guest'],
		allows: [{
			resources: '/api/superbasics',
			permissions: ['get']
		}, {
			resources: '/api/superbasics/:superbasicId',
			permissions: ['get']
		}]
	}]);
};

/**
 * Check If Superbasics Policy Allows
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
