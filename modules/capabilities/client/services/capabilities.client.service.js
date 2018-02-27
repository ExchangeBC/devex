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
	})
	// -------------------------------------------------------------------------
	//
	// given a set of capabilities and a scope, set up the need scope items
	//
	// -------------------------------------------------------------------------
	.factory ('CapabilitiesMethods', function () {
		return {
			// -------------------------------------------------------------------------
			//
			// dump out the current state
			//
			// -------------------------------------------------------------------------
			dump: function (scope) {
				// console.log ('scope.capabilities', scope.capabilities);
				// console.log ('scope.iCapabilities', scope.iCapabilities);
				// console.log ('scope.iCapabilitySkills', scope.iCapabilitySkills);
				// console.log ('scope.iOppCapabilities', scope.iOppCapabilities);
				// console.log ('scope.iOppCapabilitySkills', scope.iOppCapabilitySkills);
			},
			// -------------------------------------------------------------------------
			//
			// set up the arrays and indexes on the scope and in the model
			//
			// -------------------------------------------------------------------------
			init: function (scope, model, capabilities) {
				scope.capabilities = capabilities;
				//
				// index all the capabilities and skills by code, these are links to the actual objects
				//
				scope.iCapabilities = {};
				scope.iCapabilitySkills = {};
				scope.iOppCapabilities = {};
				scope.iOppCapabilitySkills = {};
				scope.i2cc = {};
				scope.i2cs = {};
				//
				// if capabilities or skills not present make the empty arrays
				//
				if (!model.capabilities) model.capabilities = [];
				if (!model.capabilitySkills) model.capabilitySkills = [];
				//
				// set up flags for all capabilities, initially set to false
				//
				scope.capabilities.forEach (function (c) {
					scope.i2cc[c._id.toString()] = c.code;
					scope.iCapabilities[c.code] = c;
					scope.iOppCapabilities[c.code] = false;
					c.skills.forEach (function (capabilitySkill) {
						scope.i2cs[capabilitySkill._id.toString()] = capabilitySkill.code;
						scope.iCapabilitySkills[capabilitySkill.code] = capabilitySkill;
						scope.iOppCapabilitySkills[capabilitySkill.code] = false;
					});
				});
				//
				// now set the ones we have to true
				//
				model.capabilities.forEach (function (capability) {
					scope.iOppCapabilities[capability.code] = true;
				});
				model.capabilitySkills.forEach (function (capabilitySkill) {
					scope.iOppCapabilitySkills[capabilitySkill.code] = true;
				});
			},
			// -------------------------------------------------------------------------
			//
			// prepare the arrays in the model from the new scope items
			//
			// -------------------------------------------------------------------------
			reconcile : function (scope, model) {
				//
				// sort of super duper blunt, but first clear the arrays
				//
				model.capabilities.length = 0;
				model.capabilitySkills.length = 0;
				//
				// now push on all the correct stuff
				// if the flag is set push the object (from the index by code) onto the opp array
				//
				Object.keys(scope.iCapabilities).forEach (function (code) {
					if (scope.iOppCapabilities[code]) model.capabilities.push (scope.iCapabilities[code]);
				});
				Object.keys(scope.iCapabilitySkills).forEach (function (code) {
					if (scope.iOppCapabilitySkills[code]) model.capabilitySkills.push (scope.iCapabilitySkills[code]);
				});
			}
		}
	})
	;
}());
