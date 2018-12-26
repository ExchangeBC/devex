'use strict';

import angular from 'angular';
import ICapabilityDocument from '../../server/interfaces/ICapabilityDocument';

interface ICapability extends ng.resource.IResource<ICapabilityDocument> {
	capabilityId: string;
}

export interface ICapabilitiesService extends ng.resource.IResourceClass<ICapability> {
	create(capability: ICapability): ICapability,
	update(capability: ICapability): ICapability,
	list(): ICapability[],
}

(() => {
	angular
		.module('capabilities.services')

		// Service for capabilities
		.factory('CapabilitiesService', [
			'$resource',
			'$log',
			($resource: ng.resource.IResourceService): ICapabilitiesService => {

				let createAction: ng.resource.IActionDescriptor;
				createAction = {
					method: 'POST'
				}

				let updateAction: ng.resource.IActionDescriptor;
				updateAction = {
					method: 'PUT'
				}

				let listAction: ng.resource.IActionDescriptor;
				listAction = {
					method: 'GET',
					url: '/api/capabilities',
					isArray: true
				}

				const capabilitiesService = $resource('/api/capabilities/:capabilityId',
				{
					capabilityId: '@_id'
				},
				{
					create: createAction,
					update: updateAction,
					list: listAction
				}) as ICapabilitiesService;

				return capabilitiesService;
			}
		]);
})();
