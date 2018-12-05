'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities.services')

		// Service for capabilities
		.factory('CapabilitiesService', [
			'$resource',
			'$log',
			($resource, $log) => {
				const Capability = $resource(
					'/api/capabilities/:capabilityId',
					{
						capabilityId: '@_id'
					},
					{
						update: {
							method: 'PUT'
						},
						list: {
							method: 'GET',
							url: '/api/capabilities',
							isArray: true
						}
					}
				);
				angular.extend(Capability.prototype, {
					createOrUpdate: () => {
						const capability = this;
						if (capability._id) {
							return capability.$update(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						} else {
							return capability.$save(
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
				return Capability;
			}
		]);
})();
