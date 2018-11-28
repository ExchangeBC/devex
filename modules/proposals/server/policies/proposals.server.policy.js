'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Proposals Permissions
 */
exports.invokeRolesPolicies = function() {
	acl.allow([
		{
			roles: ['admin', 'gov'],
			allows: [
				{
					resources: '/api/proposals',
					permissions: '*'
				},
				{
					resources: '/api/proposals/:proposalId',
					permissions: '*'
				},
				{
					resources: '/api/proposals/:proposalId/assignmentStatus',
					permissions: ['put']
				},
				{
					resources: '/api/proposalsSWU/:proposalId/assignmentStatus',
					permissions: ['put']
				},
				{
					resources: '/api/proposals/for/:opportunityId',
					permissions: ['get']
				}
			]
		},
		{
			roles: ['user'],
			allows: [
				{
					resources: '/api/proposals',
					permissions: ['post']
				},
				{
					resources: '/api/assign/proposal/:proposalId',
					permissions: ['put']
				},
				{
					resources: '/api/proposals/resources/opportunity/:opportunityId/org/:orgSmallId',
					permissions: ['get']
				},
				{
					resources: '/api/proposals/my/:opportunityId',
					permissions: ['get']
				},
				{
					resources: '/api/proposals/:proposalId/documents',
					permissions: ['post']
				},
				{
					resources: '/api/proposals/:proposalId/documents/:documentId',
					permissions: ['get', 'delete']
				},
				{
					resources: '/api/proposals/:proposalId',
					permissions: '*'
				}
			]
		},
		{
			roles: ['guest'],
			allows: []
		}
	]);
};

/**
 * Check If Proposals Policy Allows
 */
exports.isAllowed = function(req, res, next) {
	var roles = req.user ? req.user.roles : ['guest'];

	// If an Proposal is being processed and the current user created it then allow any manipulation
	if (req.proposal && req.user && req.proposal.user && req.proposal.user.id === req.user.id) {
		return next();
	}

	// Check for user roles
	acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function(err, isAllowed) {
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
