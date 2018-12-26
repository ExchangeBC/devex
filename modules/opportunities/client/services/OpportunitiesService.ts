'use strict';

import angular from 'angular';
import IOpportunityDocument from '../../server/interfaces/IOpportunityDocument';

interface IServiceParams {
	opportunityId?: string;
	proposalId?: string;
	code?: string;
	action?: string;
	preapproval?: string;
}

interface IOpportunity extends ng.resource.IResource<IOpportunityDocument> {
	opportunityId: '@_id';
}

interface IOpportunitiesResource extends ng.resource.IResourceClass<IOpportunity>, IOpportunity {
	create(opportunity: IOpportunity): IOpportunity;
	update(opportunity: IOpportunity): IOpportunity;
	publish(params: IServiceParams): IOpportunity;
	unpublish(params: IServiceParams): IOpportunity;
	assign(params: IServiceParams): IOpportunity;
	unassign(params: IServiceParams): IOpportunity;
	addWatch(params: IServiceParams): IOpportunity;
	removeWatch(params: IServiceParams): IOpportunity;
	getDeadlineStatus(params: IServiceParams): string;
	getProposalStats(params: IServiceParams): object;
	requestCode(params: IServiceParams): void;
	submitCode(params: IServiceParams): any;
}

export default class OpportunitiesService {
	public static $inject = ['$resource'];
	private opportunitiesResource: IOpportunitiesResource;

	private createAction: ng.resource.IActionDescriptor = {
		method: 'POST',
		transformResponse: this.transformResponse
	};

	private updateAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		transformResponse: this.transformResponse
	};

	private publishAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/publish',
		params: { opportunityId: '@opportunityId' }
	};

	private unpublishAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/unpublish',
		params: { opportunityId: '@opportunityId' }
	};

	private assignAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/assign/:proposalId',
		params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
	};

	private unassignAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/unassign/:proposalId',
		params: { opportunityId: '@opportunityId', proposalId: '@proposalId' }
	};

	private addWatchAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/watch/add',
		params: { opportunityId: '@opportunityId' }
	};

	private removeWatchAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/watch/remove',
		params: { opportunityId: '@opportunityId' }
	};

	private getDeadlineStatusAction: ng.resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/opportunities/:opportunityId/deadline/status'
	};

	private getProposalStatsAction: ng.resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/opportunities/:opportunityId/proposalStats'
	};

	private requestCodeAction: ng.resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/opportunities/:opportunityId/sendcode',
		params: { opportunityId: '@opportunityId' }
	};

	private submitCodeAction: ng.resource.IActionDescriptor = {
		method: 'POST',
		url: '/api/opportunities/:opportunityId/action',
		params: { opportunityId: '@opportunityId' }
	};

	constructor($resource: ng.resource.IResourceService) {
		this.opportunitiesResource = $resource(
			'/api/opportunities/:opportunityId',
			{
				opportunityId: '@_id'
			},
			{
				create: this.createAction,
				update: this.updateAction,
				publish: this.publishAction,
				unpublish: this.unpublishAction,
				assign: this.assignAction,
				unassign: this.unassignAction,
				addWatch: this.addWatchAction,
				removeWatch: this.removeWatchAction,
				getDeadlineStatus: this.getDeadlineStatusAction,
				getProposalStats: this.getProposalStatsAction,
				requestCode: this.requestCodeAction,
				submitCode: this.submitCodeAction
			}
		) as IOpportunitiesResource;
	}

	public getOpportunityResource(): IOpportunitiesResource {
		return this.opportunitiesResource;
	}

	private transformResponse(data: any) {
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
}

angular.module('opportunities.services').service('opportunitiesService', OpportunitiesService);
