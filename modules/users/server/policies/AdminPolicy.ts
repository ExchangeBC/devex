'use strict';

import acl from 'acl';

class AdminPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: AdminPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin'],
				allows: [
					{
						resources: '/api/users',
						permissions: '*'
					},
					{
						resources: '/api/users/:userId',
						permissions: '*'
					}
				]
			}
		]);
	};

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

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

export default AdminPolicy.getInstance();
