'use strict';

import angular, { IPromise, resource } from 'angular';
import { ICapability } from '../../shared/ICapabilityDTO';

export interface ICapabilityResource extends resource.IResource<ICapability>, ICapability {
	capabilityId: '@_id';
	$promise: IPromise<ICapabilityResource>;
}

export interface ICapabilitiesService extends resource.IResourceClass<ICapabilityResource> {
	create(capability: ICapabilityResource): ICapabilityResource;
	update(capability: ICapabilityResource): ICapabilityResource;
	list(): ICapabilityResource[];
}

angular.module('capabilities.services').factory('CapabilitiesService', [
	'$resource',
	($resource: resource.IResourceService): ICapabilitiesService => {
		const createAction: resource.IActionDescriptor = {
			method: 'POST'
		};

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		const listAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/capabilities',
			isArray: true
		};

		return $resource(
			'/api/capabilities/:capabilityId',
			{
				capabilityId: '@_id'
			},
			{
				create: createAction,
				update: updateAction,
				list: listAction
			}
		) as ICapabilitiesService;
	}
]);
