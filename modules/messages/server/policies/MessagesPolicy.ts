'use strict';

import acl from 'acl';

class MessagesPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: MessagesPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/messages',
						permissions: 'get'
					},
					{
						resources: '/api/messages/count',
						permissions: 'get'
					},
					{
						resources: '/api/messages/:messageId/action',
						permissions: 'put'
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

export default MessagesPolicy.getInstance();
