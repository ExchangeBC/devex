'use strict';

import * as acl from 'acl';

export class UserPolicy {
	private aclMem;
	constructor() {
		this.aclMem = new acl(new acl.memoryBackend());
		this.invokeRolesPolicies();
	}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/users',
						permissions: ['delete', 'put']
					},
					{
						resources: '/api/users/me',
						permissions: 'get'
					},
					{
						resources: '/api/users/password',
						permissions: 'post'
					},
					{
						resources: '/api/users/picture',
						permissions: 'post'
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
