(function () {
	'use strict';
	angular.module ('capabilities')
	// =========================================================================
	//
	// Controller for the master list of capabilities
	//
	// =========================================================================
	.controller ('CapabilitiesListController', function (capabilities, Authentication) {
		var vm         = this;
		vm.capabilities = capabilities;
	})
	// =========================================================================
	//
	// Controller the view of the capability page
	//
	// =========================================================================
	.controller ('CapabilityViewController', function ($sce, $state, capability, Authentication, Notification) {
		var vm                 = this;
		vm.trust               = $sce.trustAsHtml;
		vm.capability          = capability;
		vm.auth                = Authentication;
		vm.canEdit             = Authentication.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the capability page
	//
	// =========================================================================
	.controller ('CapabilityEditController', function ($scope, $state, capability, Authentication, Notification, TINYMCE_OPTIONS) {
		var qqq            = this;
		qqq.capability     = capability;
		qqq.auth           = Authentication;
		qqq.tinymceOptions = TINYMCE_OPTIONS;
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
	})
	;
}());
