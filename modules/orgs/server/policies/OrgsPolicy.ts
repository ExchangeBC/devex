'use strict';

import acl from 'acl';

class OrgsPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OrgsPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin'],
				allows: [
					{
						resources: '/api/orgs',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/filter',
						permissions: ['get']
					},
					{
						resources: '/api/orgs/my',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/myadmin',
						permissions: ['*']
					},
					{
						resources: '/api/addmeto/org/:orgId',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId/user/:userId/remove',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId',
						permissions: ['*']
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/orgs',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/filter',
						permissions: ['get']
					},
					{
						resources: '/api/orgs/my',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/myadmin',
						permissions: ['*']
					},
					{
						resources: '/api/addmeto/org/:orgId',
						permissions: ['*']
					},
					{
						resources: '/api/org/:orgId/upload/logo',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId/user/:userId/remove',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId/removeMeFromCompany',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId',
						permissions: ['*']
					},
					{
						resources: '/api/orgs/:orgId/joinRequest',
						permissions: ['put']
					},
					{
						resources: '/api/orgs/:orgId/acceptRequest/:userId',
						permissions: ['put']
					},
					{
						resources: '/api/orgs/:orgId/declineRequest/:userId',
						permissions: ['put']
					}
				]
			},
			{
				roles: ['guest'],
				allows: [
					{
						resources: '/api/orgs',
						permissions: ['get']
					},
					{
						resources: '/api/orgs/filter',
						permissions: ['get']
					},
					{
						resources: '/api/orgs/:orgId',
						permissions: ['get']
					}
				]
			}
		]);
	};

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

		// If an org is being processed and the current user created it then allow any manipulation
		if (req.org && req.user && req.org.user && req.org.user.id === req.user.id) {
			return next();
		}

		// Check for user roles
		this.aclMem.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), (err, isAllowed) => {
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
}

export default OrgsPolicy.getInstance();
