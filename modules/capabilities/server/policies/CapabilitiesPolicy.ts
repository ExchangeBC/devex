'use strict';

import acl from 'acl';

class CapabilitiesPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CapabilitiesPolicy;

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
						resources: '/api/capabilities',
						permissions: '*'
					},
					{
						resources: '/api/capabilities/:capabilityId',
						permissions: '*'
					},
					{
						resources: '/api/capabilityskill',
						permissions: '*'
					},
					{
						resources: '/api/capabilityskill/:capabilityskillId',
						permissions: '*'
					}
				]
			},
			{
				roles: ['gov'],
				allows: [
					{
						resources: '/api/capabilities',
						permissions: ['get']
					},
					{
						resources: '/api/capabilities/:capabilityId',
						permissions: ['get']
					},
					{
						resources: '/api/capabilityskill',
						permissions: ['post']
					},
					{
						resources: '/api/capabilityskill/:capabilityskillId',
						permissions: ['get', 'put', 'delete']
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/capabilities',
						permissions: ['get']
					},
					{
						resources: '/api/capabilities/:capabilityId',
						permissions: ['get']
					},
					{
						resources: '/api/capabilityskill',
						permissions: '*'
					},
					{
						resources: '/api/capabilityskill/:capabilityskillId',
						permissions: '*'
					}
				]
			},
			{
				roles: ['guest'],
				allows: [
					{
						resources: '/api/capabilities',
						permissions: ['get']
					},
					{
						resources: '/api/capabilities/:capabilityId',
						permissions: ['get']
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

export default CapabilitiesPolicy.getInstance();
