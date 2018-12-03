'use strict';

import angular from 'angular';

// Opportunities service used to communicate with Opportunities REST endpoints
(() => {
	angular
		.module('opportunities')

		// service for database interaction - the $resource for opportunities
		.factory('OpportunitiesService', [
			'$resource',
			'$log',
			($resource, $log) => {
				const Opportunity = $resource(
					'/api/opportunities/:opportunityId',
					{
						opportunityId: '@_id'
					},
					{
						update: {
							method: 'PUT',
							transformResponse(data) {
								data = angular.fromJson(data);
								data.deadline = new Date(data.deadline);
								data.assignment = new Date(data.assignment);
								data.start = new Date(data.start);
								data.inceptionStartDate = new Date(data.inceptionStartDate);
								data.inceptionEndDate = new Date(data.inceptionEndDate);
								data.prototypeStartDate = new Date(data.prototypeStartDate);
								data.prototypeEndDate = new Date(data.prototypeEndDate);
								data.implementationStartDate = new Date(data.implementationStartDate);
								data.implementationEndDate = new Date(data.implementationEndDate);
								return data;
							}
						},
						save: {
							method: 'POST',
							transformResponse(data) {
								data = angular.fromJson(data);
								data.deadline = new Date(data.deadline);
								data.assignment = new Date(data.assignment);
								data.start = new Date(data.start);
								data.inceptionStartDate = new Date(data.inceptionStartDate);
								data.inceptionEndDate = new Date(data.inceptionEndDate);
								data.prototypeStartDate = new Date(data.prototypeStartDate);
								data.prototypeEndDate = new Date(data.prototypeEndDate);
								data.implementationStartDate = new Date(data.implementationStartDate);
								data.implementationEndDate = new Date(data.implementationEndDate);
								return data;
							}
						},
						publish: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/publish',
							params: { opportunityId: '@opportunityId' }
						},
						unpublish: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/unpublish',
							params: { opportunityId: '@opportunityId' }
						},
						assign: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/assign/:proposalId',
							params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
						},
						unassign: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/unassign/:proposalId',
							params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
						},
						addWatch: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/watch/add',
							params: { opportunityId: '@opportunityId' }
						},
						removeWatch: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/watch/remove',
							params: { opportunityId: '@opportunityId' }
						},
						getDeadlineStatus: {
							method: 'GET',
							url: '/api/opportunities/:opportunityId/deadline/status'
						},
						getProposalStats: {
							method: 'GET',
							url: '/api/opportunities/:opportunityId/proposalStats'
						},
						requestCode: {
							method: 'PUT',
							url: '/api/opportunities/:opportunityId/sendcode',
							params: { opportunityId: '@opportunityId' }
						},
						submitCode: {
							method: 'POST',
							url: '/api/opportunities/:opportunityId/action',
							params: { opportunityId: '@opportunityId' }
						}
					}
				);

				angular.extend(Opportunity.prototype, {
					createOrUpdate() {
						const opportunity = this;
						if (opportunity._id) {
							return opportunity.$update(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						} else {
							return opportunity.$save(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						}
					}
				});
				return Opportunity;
			}
		]);
})();
