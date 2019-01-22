'use strict';

import angular, { IPromise, resource } from 'angular';
import { IOrg } from '../../shared/IOrgDTO';

interface IOrgServiceParams {
	orgId?: string;
	userId?: string;
}

export interface IOrgResource extends resource.IResource<IOrgResource>, IOrg {
	orgId: string;
	$promise: IPromise<IOrgResource>;
}

export interface IOrgService extends resource.IResourceClass<IOrgResource> {
	create(org: IOrgResource): IOrgResource;
	update(org: IOrgResource): IOrgResource;
	list(): IOrgResource[];
	my(): IOrgResource[];
	myadmin(): IOrgResource[];
	removeUser(params: IOrgServiceParams): IOrgResource;
	addMeToOrg(params: IOrgServiceParams): IOrgResource;
	removeMeFromOrg(params: IOrgServiceParams): IOrgResource;
	joinRequest(params: IOrgServiceParams): IOrgResource;
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

		return $resource(
			'/api/orgs/:orgId',
			{
				orgId: '@_id'
			},
			{
				create: createAction,
				update: updateAction,
				list: listAction,
				my: myAction,
				myadmin: myAdminAction,
				removeUser: removeUserAction,
				addMeToOrg: addMeToOrgAction,
				removeMeFromOrg: removeMeFromOrgAction,
				joinRequest: joinRequestAction
			}
		) as IOrgService;
	}
]);
