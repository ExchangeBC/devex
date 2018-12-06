'use strict';

import acl from 'acl';

class AuthPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: AuthPolicy;
	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['guest', 'user', 'admin'],
				allows: [
					{
						resources: '/api/auth/signup',
						permissions: 'post'
					},
					{
						resources: '/api/auth/signin',
						permissions: 'post'
					},
					{
						resources: '/api/auth/github',
						permissions: 'get'
					},
					{
						resources: '/api/auth/github/callback',
						permissions: 'get'
					},
					{
						resources: '/api/auth/forgot',
						permissions: 'post'
					},
					{
						resources: '/api/auth/signout',
						permissions: 'get'
					},
					{
						resources: '/api/auth/reset/:token',
						permissions: ['get', 'post']
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

export default AuthPolicy.getInstance();
