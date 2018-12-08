'use strict';

import angular from 'angular';

// Proposals service used to communicate Proposals REST endpoints
(() => {
	angular.module('proposals').factory('ProposalsService', ProposalsService);

	ProposalsService.$inject = ['$resource', '$log'];

	function ProposalsService($resource, $log) {
		const Proposal = $resource(
			'/api/proposals/:proposalId',
			{
				proposalId: '@_id'
			},
			{
				update: {
					method: 'PUT'
				},
				assign: {
					method: 'PUT',
					url: '/api/proposals/:proposalId/assignmentStatus'
				},
				assignswu: {
					method: 'PUT',
					url: '/api/proposalsSWU/:proposalId/assignmentStatus'
				},
				removeDoc: {
					method: 'DELETE',
					url: '/api/proposals/:proposalId/documents/:documentId'
				},
				makeRequest: {
					method: 'GET',
					url: '/api/request/proposal/:proposalId'
				},
				getMyProposal: {
					method: 'GET',
					url: '/api/proposals/my/:opportunityId'
				},
				getProposalsForOpp: {
					method: 'GET',
					url: '/api/proposals/for/:opportunityId',
					isArray: true
				},
				getPotentialResources: {
					method: 'GET',
					url: '/api/proposals/resources/opportunity/:opportunityId/org/:orgId',
					isArray: false
				},
				getRequests: {
					method: 'GET',
					url: '/api/proposals/requests/:proposalId',
					isArray: true
				},
				getMembers: {
					method: 'GET',
					url: '/api/proposals/members/:proposalId',
					isArray: true
				},
				confirmMember: {
					method: 'GET',
					url: '/api/proposals/requests/confirm/:proposalId/:userId'
				},
				denyMember: {
					method: 'GET',
					url: '/api/proposals/requests/deny/:proposalId/:userId'
				}
			}
		);

		angular.extend(Proposal.prototype, {
			createOrUpdate() {
				const proposal = this;
				return createOrUpdate(proposal);
			}
		});
		return Proposal;

		function createOrUpdate(proposal) {
			if (proposal._id) {
				return proposal.$update(onSuccess, onError);
			} else {
				return proposal.$save(onSuccess, onError);
			}

			// Handle successful response
			function onSuccess() {
				// Any required internal processing from inside the service, goes here.
			}

			// Handle error response
			function onError(errorResponse) {
				const error = errorResponse.data;
				// Handle error internally
				handleError(error);
			}

			function handleError(error) {
				// Log error
				$log.error(error);
			}
		}
	}
})();
