// Capabilities service used to communicate Capabilities REST endpoints
(function () {
	'use strict';
	angular.module ('capabilities.services')
	// -------------------------------------------------------------------------
	//
	// service for capabilities
	//
	// -------------------------------------------------------------------------
	.factory ('CapabilitiesService', ['$resource', '$log', function ($resource, $log) {
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
	}])
	// -------------------------------------------------------------------------
	//
	// service for capability skills
	//
	// -------------------------------------------------------------------------
	.factory ('CapabilitySkillsService', ['$resource', '$log', function ($resource, $log) {
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
	}])
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
			dump: function (title) {
				title = (title || 'capabilities') + ':';
			},
			// -------------------------------------------------------------------------
			//
			// set up the arrays and indexes on the scope and in the model
			//
			// -------------------------------------------------------------------------
			init: function (scope, model, capabilities, phase) {
				//
				// if phase is supplied then filter by phase flag otherwise just set all the capabilities
				//
				if (phase) {
					var inp = (phase === 'inception');
					var prp = (phase === 'prototype');
					var imp = (phase === 'implementation');
					scope.capabilities = [];
					capabilities.forEach (function (c) {
						if ((inp && c.isInception) || (prp && c.isPrototype) || (imp && c.isImplementation)) {
							scope.capabilities.push (c);
						}
					});
				}
				else {
					scope.capabilities = capabilities;
				}
				//
				// a collection of all capability skills within scope.capabilities
				//
				scope.capabilitySkills = [];
				//
				// index all the capabilities and skills by code, these are links to the actual objects
				//
				scope.iCapabilities = {};
				scope.iCapabilitySkills = {};
				//
				// an object of code:boolean pairs indicating whether or not the capability
				// is required, is core, and of the skill is required
				//
				scope.iOppCapabilities = {};
				scope.iOppCapabilitiesCore = {};
				scope.iOppCapabilitySkills = {};
				//
				// also make a list of required capability codes and skill codes
				//
				scope.oppCapabilityCodes = [];
				scope.oppCapabilitySkillCodes = [];
				//
				// a pair of objects linking _ids to codes
				//
				scope.i2cc = {};
				scope.i2cs = {};
				//
				// if capabilities or skills not present make the empty arrays
				//
				if (!model.capabilities) model.capabilities = [];
				if (!model.capabilitiesCore) model.capabilitiesCore = [];
				if (!model.capabilitySkills) model.capabilitySkills = [];
				//
				// set up flags for all capabilities, initially set to false
				//
				scope.capabilities.forEach (function (c) {
					scope.i2cc[c._id.toString()] = c.code;
					scope.iCapabilities[c.code] = c;
					scope.iOppCapabilities[c.code] = false;
					scope.iOppCapabilitiesCore[c.code] = false;
					c.skills.forEach (function (capabilitySkill) {
						scope.capabilitySkills.push (capabilitySkill);
						scope.i2cs[capabilitySkill._id.toString()] = capabilitySkill.code;
						scope.iCapabilitySkills[capabilitySkill.code] = capabilitySkill;
						scope.iOppCapabilitySkills[capabilitySkill.code] = false;
					});
				});
				//
				// now set the ones we have to true
				//
				//
				// first make a list of listed skills, this may include skills not
				// under any required capability
				//
				var listedSkills = {};
				model.capabilitySkills.forEach (function (capabilitySkill) {
					listedSkills[capabilitySkill.code] = true;
				});
				//
				// now deal with capabilities and only retrieve nested skills
				//
				model.capabilities.forEach (function (capability) {
					scope.iOppCapabilities[capability.code] = true;
					scope.oppCapabilityCodes.push (capability.code);
					//
					// only set skills for which we have capabilities, this is becuase
					// we just happen to magically know that skills become disjoint
					// from capabilities in the database since they are not nested
					// and treated as subbordinate in some cases and aggregate in others
					//
					var c = scope.iCapabilities[capability.code];
					c.skills.forEach (function (capabilitySkill) {
						scope.iOppCapabilitySkills[capabilitySkill.code] = listedSkills[capabilitySkill.code] || false;
						if (scope.iOppCapabilitySkills[capabilitySkill.code]) scope.oppCapabilitySkillCodes.push (capabilitySkill.code);
					});
				});
				model.capabilitiesCore.forEach (function (capability) {
					scope.iOppCapabilitiesCore[capability.code] = true;
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
				model.capabilitiesCore.length = 0;
				model.capabilitySkills.length = 0;
				//
				// now push on all the correct stuff
				// if the flag is set push the object (from the index by code) onto the opp array
				//
				Object.keys(scope.iCapabilities).forEach (function (code) {
					if (scope.iOppCapabilities[code]) model.capabilities.push (scope.iCapabilities[code]);
				});
				Object.keys(scope.iCapabilities).forEach (function (code) {
					if (scope.iOppCapabilitiesCore[code]) model.capabilitiesCore.push (scope.iCapabilities[code]);
				});
				Object.keys(scope.iCapabilitySkills).forEach (function (code) {
					if (scope.iOppCapabilitySkills[code]) model.capabilitySkills.push (scope.iCapabilitySkills[code]);
				});
			}
		}
	})
	;
}());
