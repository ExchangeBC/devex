'use strict';

import angular, { IPromise, resource } from 'angular';
import { IOpportunity } from '../../shared/IOpportunityDTO';

interface IOpportunityServiceParams {
	opportunityId?: string;
	proposalId?: string;
	code?: string;
	action?: string;
	preapproval?: string;
}

interface IDeadlineResource extends resource.IResource<any> {
	$promise: IPromise<any>
}

export interface IOpportunityResource extends resource.IResource<IOpportunity>, IOpportunity {
	opportunityId: '@_id';
	$promise: IPromise<IOpportunityResource>;
}

export interface IOpportunitiesService extends resource.IResourceClass<IOpportunityResource> {
	create(opportunity: IOpportunityResource): IOpportunityResource;
	update(opportunity: IOpportunityResource): IOpportunityResource;
	publish(params: IOpportunityServiceParams): IOpportunityResource;
	unpublish(params: IOpportunityServiceParams): IOpportunityResource;
	assign(params: IOpportunityServiceParams): IOpportunityResource;
	assignswu(params: IOpportunityServiceParams): IOpportunityResource;
	unassign(params: IOpportunityServiceParams): IOpportunityResource;
	addWatch(params: IOpportunityServiceParams): IOpportunityResource;
	removeWatch(params: IOpportunityServiceParams): IOpportunityResource;
	getDeadlineStatus(params: IOpportunityServiceParams): IDeadlineResource;
	getProposalStats(params: IOpportunityServiceParams): object;
	requestCode(params: IOpportunityServiceParams): IOpportunityResource;
	submitCode(params: IOpportunityServiceParams): IOpportunityResource;
}

angular.module('opportunities.services').factory('OpportunitiesService', [
	'$resource',
	($resource: resource.IResourceService): IOpportunitiesService => {
		function transformResponse(data: any): IOpportunityResource {
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

		const createAction: resource.IActionDescriptor = {
			method: 'POST',
			transformResponse
		};

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT',
			transformResponse
		};

		const publishAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/publish',
			params: { opportunityId: '@opportunityId' }
		};

		const unpublishAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/unpublish',
			params: { opportunityId: '@opportunityId' }
		};

		const assignAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/assign/:proposalId',
			params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
		};

		const assignSWUAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/assignswu/:proposalId',
			params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
		};

		const unassignAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/unassign/:proposalId',
			params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
		};

		const addWatchAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/watch/add',
			params: { opportunityId: '@opportunityId' }
		};

		const removeWatchAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/watch/remove',
			params: { opportunityId: '@opportunityId' }
		};

		const getDeadlineStatusAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/opportunities/:opportunityId/deadline/status'
		};

		const getProposalStatsAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/opportunities/:opportunityId/proposalStats'
		};

		const requestCodeAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/opportunities/:opportunityId/sendcode',
			params: { opportunityId: '@opportunityId' }
		};

		const submitCodeAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/opportunities/:opportunityId/action',
			params: { opportunityId: '@opportunityId' }
		};

		return $resource(
			'/api/opportunities/:opportunityId',
			{
				opportunityId: '@_id'
			},
			{
				create: createAction,
				update: updateAction,
				publish: publishAction,
				unpublish: unpublishAction,
				assign: assignAction,
				assignswu: assignSWUAction,
				unassign: unassignAction,
				addWatch: addWatchAction,
				removeWatch: removeWatchAction,
				getDeadlineStatus: getDeadlineStatusAction,
				getProposalStats: getProposalStatsAction,
				requestCode: requestCodeAction,
				submitCode: submitCodeAction
			}
		) as IOpportunitiesService;
	}
]);
