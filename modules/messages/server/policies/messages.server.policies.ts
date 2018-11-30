'use strict';

import * as acl from 'acl';

export class MessagesPolicy {
	private aclMem = new acl(new acl.memoryBackend());

	constructor() {
		this.invokeRolesPolicies();
	}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin'],
				allows: [
					{
						resources: '/api/adminmessages/archiveold',
						permissions: 'get'
					},
					{
						resources: '/api/adminmessages/emailretry',
						permissions: 'get'
					},
					{
						resources: '/api/messages/sendmessage/:messagecd',
						permissions: 'put'
					},
					{
						resources: '/api/messagetemplates',
						permissions: ['get', 'post']
					},
					{
						resources: '/api/messagetemplates/:templateId',
						permissions: ['get', 'put', 'delete']
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/my/messages',
						permissions: 'get'
					},
					{
						resources: '/api/my/archivedmessages',
						permissions: 'get'
					},
					{
						resources: '/api/my/messages/count',
						permissions: 'get'
					},
					{
						resources: '/api/my/archivedmessages/count',
						permissions: 'get'
					},
					{
						resources: '/api/archivedmessages/:amessageId',
						permissions: 'get'
					},
					{
						resources: '/api/messages/:messageId',
						permissions: ['get', 'delete']
					},
					{
						resources: '/api/messages/:messageId/viewed',
						permissions: 'get'
					},
					{
						resources: '/api/messages/:messageId/actioned/:action',
						permissions: 'get'
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
