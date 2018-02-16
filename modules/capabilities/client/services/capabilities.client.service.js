// Capabilities service used to communicate Capabilities REST endpoints
(function () {
	'use strict';
	angular.module ('capabilities.services')
	// -------------------------------------------------------------------------
	//
	// service for capabilities
	//
	// -------------------------------------------------------------------------
	.factory ('CapabilitiesService', function ($resource, $log) {
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
	})
	// -------------------------------------------------------------------------
	//
	// service for capability skills
	//
	// -------------------------------------------------------------------------
	.factory ('CapabilitySkillsService', function ($resource, $log) {
		var CapabilitySkill = $resource ('/api/capabilityskill/:capabilityskillId', {
			capabilityskillId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
		angular.extend (CapabilitySkill.prototype, {
			createOrUpdate: function () {
				var capabilitySkill = this;
				if (capabilitySkill._id) {
					return capabilitySkill.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return capabilitySkill.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return CapabilitySkill;
	});
}());
