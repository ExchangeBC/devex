'use strict';

(() => {
	angular
		.module('capabilities.services')

		// Service for capability skills
		.factory('CapabilitySkillsService', [
			'$resource',
			'$log',
			($resource: ng.resource.IResourceService, $log: ng.ILogService) => {
				const CapabilitySkill = $resource(
					'/api/capabilityskill/:capabilityskillId',
					{
						capabilityskillId: '@_id'
					},
					{
						create: {
							method: 'POST'
						},
						update: {
							method: 'PUT'
						},
						remove: {
							method: 'DELETE'
						}
					}
				);
				angular.extend(CapabilitySkill.prototype, {
					createOrUpdate() {
						const capabilitySkill = this;
						if (capabilitySkill._id) {
							return capabilitySkill.$update(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						} else {
							return capabilitySkill.$save(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						}
					}
				});
				return CapabilitySkill;
			}
		]);
})();
