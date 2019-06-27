'use strict';

import angular, { IPromise, resource } from 'angular';
import { IUserResource } from '../../../users/client/services/UsersService';
import { IOrg } from '../../shared/IOrgDTO';

interface IOrgServiceParams {
	orgId?: string;
	userId?: string;
	pageNumber?: number;
	searchTerm?: string;
	itemsPerPage?: number;
}

interface IOrgRequestResponse extends resource.IResource<IOrgRequestResponse> {
	user: IUserResource,
	org: IOrgResource,
	$promise: IPromise<IOrgRequestResponse>
}

interface IOrgCreateResponse extends resource.IResource<IOrgCreateResponse> {
	user: IUserResource,
	org: IOrgResource,
	$promise: IPromise<IOrgCreateResponse>
}

export interface IOrgPagedResponse extends resource.IResource<IOrgPagedResponse> {
	data: IOrg[],
	totalFilteredItems: number,
	$promise: IPromise<IOrgPagedResponse>
}

export interface IOrgResource extends resource.IResource<IOrgResource>, IOrg {
	orgId: string;
	$promise: IPromise<IOrgResource>;
}

export interface IOrgService extends resource.IResourceClass<IOrgResource> {
	create(org: IOrgResource): IOrgCreateResponse;
	update(org: IOrgResource): IOrgResource;
	list(): IOrgResource[];
	filter(params: IOrgServiceParams): IOrgPagedResponse;
	my(): IOrgResource[];
	myadmin(): IOrgResource[];
	removeUser(params: IOrgServiceParams): IOrgResource;
	addMeToOrg(params: IOrgServiceParams): IOrgResource;
	removeMeFromOrg(params: IOrgServiceParams): IOrgResource;
	joinRequest(params: IOrgServiceParams): IOrgRequestResponse;
	acceptRequest(params: IOrgServiceParams): IOrgRequestResponse;
	declineRequest(params: IOrgServiceParams): IOrgRequestResponse;
}

angular.module('orgs.services').factory('OrgService', [
	'$resource',
	($resource: resource.IResourceService): IOrgService => {
		const createAction: resource.IActionDescriptor = {
			method: 'POST'
		};

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		const listAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs',
			isArray: true
		};

		const filterAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs/filter'
		};

		const myAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs/my',
			isArray: true
		};

		const myAdminAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs/myadmin',
			isArray: true
		};

		const removeUserAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs/:orgId/user/:userId/remove',
			isArray: false
		};

		const addMeToOrgAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/addmeto/org/:orgId',
			isArray: false
		};

		const removeMeFromOrgAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/orgs/:orgId/removeMeFromCompany',
			isArray: false
		};

		const joinRequestAction: resource.IActionDescriptor = {
			method: 'PUT',
			params: {
				orgId: '@orgId'
			},
			url: '/api/orgs/:orgId/joinRequest'
		};

		const acceptRequestAction: resource.IActionDescriptor = {
			method: 'PUT',
			params: {
				orgId: '@orgId',
				userId: '@userId'
			},
			url: '/api/orgs/:orgId/acceptRequest/:userId'
		};

		const declineRequestAction: resource.IActionDescriptor = {
			method: 'PUT',
			params: {
				orgId: '@orgId',
				userId: '@userId'
			},
			url: '/api/orgs/:orgId/declineRequest/:userId'
		}

		return $resource(
			'/api/orgs/:orgId',
			{
				orgId: '@_id'
			},
			{
				create: createAction,
				update: updateAction,
				list: listAction,
				filter: filterAction,
				my: myAction,
				myadmin: myAdminAction,
				removeUser: removeUserAction,
				addMeToOrg: addMeToOrgAction,
				removeMeFromOrg: removeMeFromOrgAction,
				joinRequest: joinRequestAction,
				acceptRequest: acceptRequestAction,
				declineRequest: declineRequestAction
			}
		) as IOrgService;
	}
]);
