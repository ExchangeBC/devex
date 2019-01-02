'use strict';

import angular, { IPromise, resource } from 'angular';
import { ICapabilitySkill } from '../../shared/ICapabilitySkillDTO';

export interface ICapabilitySkillResource extends resource.IResource<ICapabilitySkill>, ICapabilitySkill {
	capabilityskillId: '@_id';
	$promise: IPromise<ICapabilitySkill>;
	toJSON(options?: any): any;
}

export interface ICapabilitySkillResourceClass extends resource.IResourceClass<ICapabilitySkillResource> {
	create(capabilitySkill: ICapabilitySkillResource): ICapabilitySkillResource;
	update(capabilitySKill: ICapabilitySkillResource): ICapabilitySkillResource;
}

export default class CapabilitySkillsService {
	public static $inject = ['$resource'];

	private capabilitySkillsResourceClass: ICapabilitySkillResourceClass;

	private createAction: resource.IActionDescriptor = {
		method: 'POST'
	};

	private updateAction: resource.IActionDescriptor = {
		method: 'PUT'
	};

	constructor($resource: resource.IResourceService) {
		this.capabilitySkillsResourceClass = $resource(
			'/api/capabilityskill/:capabilityskillId',
			{
				capabilityskillId: '@_id'
			},
			{
				create: this.createAction,
				update: this.updateAction
			}
		) as ICapabilitySkillResourceClass;
	}

	public getCapabilitySkillResourceClass(): ICapabilitySkillResourceClass {
		return this.capabilitySkillsResourceClass;
	}
}

angular.module('capabilities.services').service('capabilitySkillsService', CapabilitySkillsService);
