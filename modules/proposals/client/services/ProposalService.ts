'use strict';

import angular, { ILogService, IPromise, resource } from 'angular';
import { IProposal } from '../../shared/IProposalDTO';

interface IServiceParams {
	proposalId?: string;
	documentId?: string;
	opportunityId?: string;
	orgId?: string;
	userId?: string;
}

export interface IProposalResource extends resource.IResource<IProposal>, IProposal {
	proposalId: '@_id';
	$promise: IPromise<IProposalResource>;
	toJSON(options?: any): any; // necessary due to toJSON being defined in both IResource and IProposalDocument
}

export interface IProposalsResourceClass extends resource.IResourceClass<IProposalResource> {
	create(proposal: IProposalResource): IProposalResource;
	update(proposal: IProposalResource): IProposalResource;
	assign(params: IServiceParams): IProposalResource;
	assignswu(params: IServiceParams): IProposalResource;
	removeDoc(params: IServiceParams): IProposalResource;
	makeRequest(params: IServiceParams): IProposalResource;
	getMyProposal(params: IServiceParams): IProposalResource;
	getProposalsForOpp(params: IServiceParams): IProposalResource[];
	getPotentialResources(params: IServiceParams): any;
	getRequests(params: IServiceParams): any[];
	getMembers(params: IServiceParams): any[];
	confirmMember(params: IServiceParams): any;
	denyMember(params: IServiceParams): any;
}

export default class ProposalService {
	public static $inject = ['$resource', '$log'];

	private proposalsResourceClass: IProposalsResourceClass;

	private createAction: resource.IActionDescriptor = {
		method: 'POST'
	};

	private updateAction: resource.IActionDescriptor = {
		method: 'PUT'
	};

	private assignAction: resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/proposalsSWU/:proposalId/assignmentStatus'
	}

	private assignSWUAction: resource.IActionDescriptor = {
		method: 'PUT',
		url: '/api/proposalsSWU/:proposalId/assignmentStatus'
	}

	private removeDocAction: resource.IActionDescriptor = {
		method: 'DELETE',
		url: '/api/proposals/:proposalId/documents/:documentId'
	}

	private makeRequestAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/request/proposal/:proposalId'
	}

	private getMyProposalAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/my/:opportunityId'
	}

	private getProposalsForOppAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/for/:opportunityId',
		isArray: true
	}

	private getPotentialResourcesAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/resources/opportunity/:opportunityId/org/:orgId',
		isArray: false
	}

	private getRequestsAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/requests/:proposalId',
		isArray: true
	}

	private getMembersAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/members/:proposalId',
		isArray: true
	}

	private confirmMemberAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/requests/confirm/:proposalId/:userId'
	}

	private denyMemberAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/proposals/requests/deny/:proposalId/:userId'
	}

	constructor($resource: resource.IResourceService, $log: ILogService) {
		this.proposalsResourceClass = $resource(
			'/api/proposals/:proposalId',
			{
				proposalId: '@_id'
			},
			{
				create: this.createAction,
				update: this.updateAction,
				assign: this.assignAction,
				assignswu: this.assignSWUAction,
				removeDoc: this.removeDocAction,
				makeRequest: this.makeRequestAction,
				getMyProposal: this.getMyProposalAction,
				getProposalsForOpp: this.getProposalsForOppAction,
				getPotentialResources: this.getPotentialResourcesAction,
				getRequests: this.getRequestsAction,
				getMembers: this.getMembersAction,
				confirmMember: this.confirmMemberAction,
				denyMember: this.denyMemberAction
			}
		) as IProposalsResourceClass;
	}

	public getProposalResourceClass(): IProposalsResourceClass {
		return this.proposalsResourceClass;
	}
}

angular.module('proposals').service('proposalService', ProposalService);
