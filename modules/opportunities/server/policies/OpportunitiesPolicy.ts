'use strict';

import acl from 'acl';

class OpportunitiesPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OpportunitiesPolicy;

	private aclMem = new acl(new acl.memoryBackend());

	private constructor() {}

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

		// If an Opportunity is being processed and the current user created it then allow any manipulation
		if (req.opportunity && req.user && req.opportunity.user && req.opportunity.user.id === req.user.id) {
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
						resources: '/api/opportunities',
						permissions: '*'
					},
					{
						resources: '/api/opportunities/:opportunityId',
						permissions: '*'
					},
					{
						resources: '/api/opportunities/:opportunityId/publish',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/unpublish',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/assign/:proposalId',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/assignswu/:proposalId',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/unassign/:proposalId',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/unassign/:opportunityId',
						permissions: ['*']
					},
					{
						resources: '/api/opportunities/:opportunityId/watch/add',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/watch/remove',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/deadline/status',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/sendcode',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/for/program/:programId',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/action',
						permissions: ['post']
					},
					{
						resources: '/api/opportunities/:opportunityId/proposalStats',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/proposalArchive',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/myProposalArchive',
						permissions: ['get']
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/opportunities',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/watch/add',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/watch/remove',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/deadline/status',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/sendcode',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/action',
						permissions: ['post']
					},
					{
						resources: '/api/opportunities/:opportunityId/myProposalArchive',
						permissions: ['get']
					}
				]
			},
			{
				roles: ['guest'],
				allows: [
					{
						resources: '/api/opportunities',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/deadline/status',
						permissions: ['get']
					},
					{
						resources: '/api/opportunities/:opportunityId/sendcode',
						permissions: ['put']
					},
					{
						resources: '/api/opportunities/:opportunityId/action',
						permissions: ['post']
					}
				]
			}
		]);
	};
}

export default OpportunitiesPolicy.getInstance();
