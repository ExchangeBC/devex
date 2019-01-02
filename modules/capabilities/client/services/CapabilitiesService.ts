'use strict';

import angular, { IPromise, resource } from 'angular';
import { ICapability } from '../../shared/ICapabilityDTO';

export interface ICapabilityResource extends resource.IResource<ICapability>, ICapability {
	capabilityId: '@_id';
	$promise: IPromise<ICapabilityResource>;
	toJSON(options?: any): any;
}

export interface ICapabilitiesResourceClass extends resource.IResourceClass<ICapabilityResource> {
	create(capability: ICapabilityResource): ICapabilityResource;
	update(capability: ICapabilityResource): ICapabilityResource;
	list(): ICapabilityResource[];
}

export default class CapabilitiesService {
	public static $inject = ['$resource'];

	private capabilitiesResourceClass: ICapabilitiesResourceClass;

	private createAction: resource.IActionDescriptor = {
		method: 'POST'
	};

	private updateAction: resource.IActionDescriptor = {
		method: 'PUT'
	};

	private listAction: resource.IActionDescriptor = {
		method: 'GET',
		url: '/api/capabilities',
		isArray: true
	};

	constructor($resource: resource.IResourceService) {
		this.capabilitiesResourceClass = $resource(
			'/api/capabilities/:capabilityId',
			{
				capabilityId: '@_id'
			},
			{
				create: this.createAction,
				update: this.updateAction,
				list: this.listAction
			}
		) as ICapabilitiesResourceClass;
	}

	public getCapabilitiesResourceClass(): ICapabilitiesResourceClass {
		return this.capabilitiesResourceClass;
	}
}

angular.module('capabilities.services').service('capabilitiesService', CapabilitiesService);
