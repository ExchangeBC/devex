'use strict';

import angular, { IPromise } from 'angular';
import IOpportunityDocument from '../../server/interfaces/IOpportunityDocument';

interface IServiceParams {
	opportunityId?: string;
	proposalId?: string;
	code?: string;
	action?: string;
	preapproval?: string;
}

export interface IOpportunityResource extends ng.resource.IResource<IOpportunityDocument>, IOpportunityDocument {
	opportunityId: '@_id';
	$promise: IPromise<IOpportunityResource>;
	toJSON(options?: any): any; // necessary due to toJSON being defined in both IResource and IOpportunityDocument
}

export interface IOpportunitiesResourceClass extends ng.resource.IResourceClass<IOpportunityResource> {
	create(opportunity: IOpportunityResource): IOpportunityResource;
	update(opportunity: IOpportunityResource): IOpportunityResource;
	publish(params: IServiceParams): IOpportunityResource;
	unpublish(params: IServiceParams): IOpportunityResource;
	assign(params: IServiceParams): IOpportunityResource;
	unassign(params: IServiceParams): IOpportunityResource;
	addWatch(params: IServiceParams): IOpportunityResource;
	removeWatch(params: IServiceParams): IOpportunityResource;
	getDeadlineStatus(params: IServiceParams): IPromise<any>;
	getProposalStats(params: IServiceParams): object;
	requestCode(params: IServiceParams): IOpportunityResource;
	submitCode(params: IServiceParams): IOpportunityResource;
}

export default class OpportunitiesService {
	public static $inject = ['$resource'];

	private opportunitiesResourceClass: IOpportunitiesResourceClass;

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
		this.opportunitiesResourceClass = $resource(
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
		) as IOpportunitiesResourceClass;
}

	public getOpportunityResourceClass(): IOpportunitiesResourceClass {
		return this.opportunitiesResourceClass;
	}

	private transformResponse(data: any): IOpportunityResource {
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
