'use strict';

import angular, { IPromise, resource } from 'angular';
import { IProposal } from '../../shared/IProposalDTO';

interface IProposalServiceParams {
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

export interface IProposalService extends resource.IResourceClass<IProposalResource> {
	create(proposal: IProposalResource): IProposalResource;
	update(proposal: IProposalResource): IProposalResource;
	assign(params: IProposalServiceParams): IProposalResource;
	assignswu(params: IProposalServiceParams): IProposalResource;
	unassignswu(params: IProposalServiceParams): IProposalResource;
	removeDoc(params: IProposalServiceParams): IProposalResource;
	makeRequest(params: IProposalServiceParams): IProposalResource;
	getMyProposal(params: IProposalServiceParams): IProposalResource;
	getProposalsForOpp(params: IProposalServiceParams): IProposalResource[];
	getPotentialResources(params: IProposalServiceParams): any;
	getRequests(params: IProposalServiceParams): any[];
	getMembers(params: IProposalServiceParams): any[];
	confirmMember(params: IProposalServiceParams): any;
	denyMember(params: IProposalServiceParams): any;
	submit(proposal: IProposalResource): IProposalResource;
}

angular.module('proposals.services').factory('ProposalService', [
	'$resource',
	($resource: resource.IResourceService): IProposalService => {
		const createAction: resource.IActionDescriptor = {
			method: 'POST'
		};

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		const assignAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/proposals/:proposalId/assigncwu',
			params: {
				proposalId: '@proposalId'
			}
		};

		const assignSWUAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/proposals/:proposalId/assignswu',
			params: {
				proposalId: '@proposalId'
			}
		};

		const unassignSWUAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/proposals/:proposalId/unassignswu',
			params: {
				proposalId: '@proposalId'
			}
		};

		const removeDocAction: resource.IActionDescriptor = {
			method: 'DELETE',
			url: '/api/proposals/:proposalId/documents/:documentId'
		};

		const makeRequestAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/request/proposal/:proposalId'
		};

		const getMyProposalAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/my/:opportunityId'
		};

		const getProposalsForOppAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/for/:opportunityId',
			isArray: true
		};

		const getPotentialResourcesAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/resources/opportunity/:opportunityId/org/:orgId',
			isArray: false
		};

		const getRequestsAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/requests/:proposalId',
			isArray: true
		};

		const getMembersAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/members/:proposalId',
			isArray: true
		};

		const confirmMemberAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/requests/confirm/:proposalId/:userId'
		};

		const denyMemberAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/proposals/requests/deny/:proposalId/:userId'
		};

		const submitAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/proposals/:proposalId/submit'
		}

		return $resource(
			'/api/proposals/:proposalId',
			{
				proposalId: '@_id'
			},
			{
				create: createAction,
				update: updateAction,
				assign: assignAction,
				assignswu: assignSWUAction,
				unassignswu: unassignSWUAction,
				removeDoc: removeDocAction,
				makeRequest: makeRequestAction,
				getMyProposal: getMyProposalAction,
				getProposalsForOpp: getProposalsForOppAction,
				getPotentialResources: getPotentialResourcesAction,
				getRequests: getRequestsAction,
				getMembers: getMembersAction,
				confirmMember: confirmMemberAction,
				denyMember: denyMemberAction,
				submit: submitAction
			}
		) as IProposalService;
	}
]);
