'use strict';

import angular, { IPromise, resource } from 'angular';
import { ICapabilitySkill } from '../../shared/ICapabilitySkillDTO';

export interface ICapabilitySkillResource extends resource.IResource<ICapabilitySkill>, ICapabilitySkill {
	capabilityskillId: '@_id';
	$promise: IPromise<ICapabilitySkill>;
}

export interface ICapabilitySkillsService extends resource.IResourceClass<ICapabilitySkillResource> {
	create(capabilitySkill: ICapabilitySkillResource): ICapabilitySkillResource;
	update(capabilitySKill: ICapabilitySkillResource): ICapabilitySkillResource;
}

angular.module('capabilities.services').factory('CapabilitySkillsService', [
	'$resource',
	($resource: resource.IResourceService): ICapabilitySkillsService => {
		const createAction: resource.IActionDescriptor = {
			method: 'POST'
		};

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		return $resource(
			'/api/capabilityskill/:capabilityskillId',
			{
				capabilityskillId: '@_id'
			},
			{
				create: createAction,
				update: updateAction
			}
		) as ICapabilitySkillsService;
	}
]);
