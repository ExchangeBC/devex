'use strict';

import acl from 'acl';

class ProgramsPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProgramsPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin', 'gov'],
				allows: [
					{
						resources: '/api/programs',
						permissions: '*'
					},
					{
						resources: '/api/new/program',
						permissions: ['get']
					},
					{
						resources: '/api/programs/members/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/requests/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/requests/confirm/:programId/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/requests/deny/:programId/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/:programId',
						permissions: '*'
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/programs',
						permissions: ['get']
					},
					{
						resources: '/api/programs/members/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/requests/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/myadmin/programs',
						permissions: ['get']
					},
					{
						resources: '/api/programs/members/:programId/confirm/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/requests/:programId/deny/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/upload/logo/program/:programId',
						permissions: ['post']
					},
					{
						resources: '/api/programs/:programId',
						permissions: ['get']
					}
				]
			},
			{
				roles: ['guest'],
				allows: [
					{
						resources: '/api/programs',
						permissions: ['get']
					},
					{
						resources: '/api/programs/members/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/programs/:programId',
						permissions: ['get']
					}
				]
			}
		]);
	};

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

		// If an program is being processed and the current user created it then allow any manipulation
		if (req.program && req.user && req.program.user && req.program.user.id === req.user.id) {
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

export default ProgramsPolicy.getInstance();
