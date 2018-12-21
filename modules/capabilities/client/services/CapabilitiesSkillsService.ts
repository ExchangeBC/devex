'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities.services')

		// Service for capability skills
		.factory('CapabilitySkillsService', [
			'$resource',
			'$log',
			($resource, $log) => {
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
