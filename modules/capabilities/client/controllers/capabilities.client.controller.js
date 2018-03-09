(function () {
	'use strict';
	angular.module ('capabilities')
	// =========================================================================
	//
	// Controller for the master list of capabilities
	//
	// =========================================================================
	.controller ('CapabilitiesListController', function (capabilities, Authentication) {
		var vm          = this;
		vm.capabilities = capabilities;
		vm.auth         = Authentication.permissions ();
	})
	// =========================================================================
	//
	// Controller the view of the capability page
	//
	// =========================================================================
	.controller ('CapabilityViewController', function ($sce, $state, capability, Authentication, Notification) {
		var vm        = this;
		vm.trust      = $sce.trustAsHtml;
		vm.capability = capability;
		vm.auth       = Authentication.permissions ();
		vm.canEdit    = vm.auth.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the capability page
	//
	// =========================================================================
	.controller ('CapabilityEditController', function ($scope, $state, capability, Authentication, Notification, TINYMCE_OPTIONS, CapabilitySkillsService) {
		var qqq            = this;
		qqq.capability     = capability;
		qqq.auth           = Authentication.permissions ();
		qqq.tinymceOptions = TINYMCE_OPTIONS;
		qqq.newskill       = '';
		qqq.editingskill   = false;
		// -------------------------------------------------------------------------
		//
		// check for duplicate skills
		//
		// -------------------------------------------------------------------------
		qqq.isDuplicateSkill = function (needle, haystack) {
			var found = false;
			var i = 0;
			while (!found && i < haystack.length) {
				found = (haystack[i++].name.toLowerCase () === needle.toLowerCase ());
			}
			return found;
		}
		// -------------------------------------------------------------------------
		//
		// save the capability, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid, leavenow) {
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.capabilityForm');
				return false;
			}
			//
			// Create a new capability, or update the current instance
			//
			qqq.capability.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.capabilityForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> capability saved successfully!'
				});
				if (leavenow) $state.go ('capabilities.view', {capabilityId:qqq.capability.code});
				qqq.capability = result;
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> capability save error!'
				});
			});
		};
		// -------------------------------------------------------------------------
		//
		// add a new capability skill
		//
		// -------------------------------------------------------------------------
		qqq.addSkill = function () {
			//
			// leave if no string
			//
			if (!qqq.newskill) {
				Notification.error ({
					message : 'No Skill was supplied',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Missing Skill'
				});
				qqq.newskill = '';
				return;
			}
			//
			// check that this is not a duplicate within the current set
			//
			if (qqq.isDuplicateSkill (qqq.newskill, qqq.capability.skills)) {
				Notification.error ({
					message : 'Duplicate Skill',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Duplicate Skill'
				});
				qqq.newskill = '';
				return;
			}
			var capabilitySkill = new CapabilitySkillsService ({
				name: qqq.newskill
			});
			capabilitySkill.createOrUpdate ()
			.then (function (result) {
				//
				// reset newskill, push the new one on the capability and save the capability
				//
				qqq.capability.skills.push (result);
				qqq.savenow (true, false);
			})
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Error Saving Skill'
				});
			});
			qqq.newskill = '';
		};
		// -------------------------------------------------------------------------
		//
		// update a skill
		//
		// -------------------------------------------------------------------------
		qqq.editSkill = function (capabilitySkill) {
			qqq.newskill = capabilitySkill.name;
			qqq.editingskill = capabilitySkill;
		}
		qqq.updateSkill = function () {
			//
			// leave if no string
			//
			if (!qqq.newskill) {
				Notification.error ({
					message : 'No Skill was supplied',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Missing Skill'
				});
				qqq.newskill = '';
				return;
			}
			//
			// check that this is not a duplicate within the current set
			//
			if (qqq.isDuplicateSkill (qqq.newskill, qqq.capability.skills)) {
				Notification.error ({
					message : 'Duplicate Skill',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Duplicate Skill'
				});
				qqq.newskill = '';
				return;
			}
			qqq.editingskill.name = qqq.newskill;
			(new CapabilitySkillsService (qqq.editingskill)).createOrUpdate ()
			.then (function (result) {
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> skill saved successfully!'
				});
			})
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Error Saving Skill'
				});
			});
			qqq.newskill     = '';
			qqq.editingskill = false;
		};
		// -------------------------------------------------------------------------
		//
		// delete a skillr
		//
		// -------------------------------------------------------------------------
		qqq.deleteSkill = function (capabilitySkill) {
			(new CapabilitySkillsService (capabilitySkill)).$remove (
			function (result) {
				// console.log ('this is running');
				qqq.capability.skills = qqq.capability.skills.reduce (function (accum, current) {
					if (current.code !== capabilitySkill.code) accum.push (current);
					return accum;
				}, []);
				qqq.savenow (true, false);
			},
			function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Error Removing Skill'
				});
			});
		};
	})
	;
}());
