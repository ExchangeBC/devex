// Capabilities service used to communicate Capabilities REST endpoints
(function () {
	'use strict';
	angular.module ('capabilities.services').factory ('CapabilitiesService', function ($resource, $log) {
		var Capability = $resource ('/api/capabilities/:capabilityId', {
			capabilityId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
		angular.extend (Capability.prototype, {
			createOrUpdate: function () {
				var capability = this;
				if (capability._id) {
					return capability.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return capability.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Capability;
	});
}());
