'use strict';

import acl from 'acl';

export class ProjectsPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProjectsPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

		// If an Project is being processed and the current user created it then allow any manipulation
		if (req.project && req.user && req.project.user && req.project.user.id === req.user.id) {
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

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin', 'gov'],
				allows: [
					{
						resources: '/api/projects',
						permissions: '*'
					},
					{
						resources: '/api/new/activity',
						permissions: ['get']
					},
					{
						resources: '/api/projects/members/:projectId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/requests/:projectId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/requests/confirm/:projectId/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/requests/deny/:projectId/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/:projectId',
						permissions: '*'
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/projects',
						permissions: ['get']
					},
					{
						resources: '/api/projects/members/:projectId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/requests/:projectId',
						permissions: ['get']
					},
					{
						resources: '/api/myadmin/projects',
						permissions: ['get']
					},
					{
						resources: '/api/projects/members/:projectId/confirm/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/requests/:projectId/deny/:userId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/:projectId',
						permissions: ['get']
					}
				]
			},
			{
				roles: ['guest'],
				allows: [
					{
						resources: '/api/projects',
						permissions: ['get']
					},
					{
						resources: '/api/projects/members/:projectId',
						permissions: ['get']
					},
					{
						resources: '/api/projects/:projectId',
						permissions: ['get']
					}
				]
			}
		]);
	};
}

export default ProjectsPolicy.getInstance();
