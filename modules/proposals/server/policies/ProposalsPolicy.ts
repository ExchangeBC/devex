'use strict';

import acl from 'acl';

class ProposalsPolicy {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProposalsPolicy;

	// Using the memory backend
	private aclMem = new acl(new acl.memoryBackend());

	public invokeRolesPolicies = () => {
		this.aclMem.allow([
			{
				roles: ['admin', 'gov'],
				allows: [
					{
						resources: '/api/proposals',
						permissions: '*'
					},
					{
						resources: '/api/proposals/:proposalId',
						permissions: '*'
					},
					{
						resources: '/api/proposals/:proposalId/assigncwu',
						permissions: ['put']
					},
					{
						resources: '/api/proposals/:proposalId/assignswu',
						permissions: ['put']
					},
					{
						resources: '/api/proposals/:proposalId/unassignswu',
						permissions: ['put']
					},
					{
						resources: '/api/proposals/for/:opportunityId',
						permissions: ['get']
					}
				]
			},
			{
				roles: ['user'],
				allows: [
					{
						resources: '/api/proposals',
						permissions: ['post']
					},
					{
						resources: '/api/assign/proposal/:proposalId',
						permissions: ['put']
					},
					{
						resources: '/api/proposals/resources/opportunity/:opportunityId/org/:orgSmallId',
						permissions: ['get']
					},
					{
						resources: '/api/proposals/my/:opportunityId',
						permissions: ['get']
					},
					{
						resources: '/api/proposals/:proposalId/documents',
						permissions: ['post']
					},
					{
						resources: '/api/proposals/:proposalId/documents/:documentId',
						permissions: ['get', 'delete']
					},
					{
						resources: '/api/proposals/:proposalId',
						permissions: '*'
					},
					{
						resources: '/api/proposals/:proposalId/submit',
						permissions: ['put']
					}
				]
			},
			{
				roles: ['guest'],
				allows: []
			}
		]);
	};

	public isAllowed = (req, res, next) => {
		const roles = req.user ? req.user.roles : ['guest'];

		// If an Proposal is being processed and the current user created it then allow any manipulation
		if (req.proposal && req.user && req.proposal.user && req.proposal.user.id === req.user.id) {
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

export default ProposalsPolicy.getInstance();
