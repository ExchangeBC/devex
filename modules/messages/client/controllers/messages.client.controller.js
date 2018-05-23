(function () {
	'use strict';
	angular.module ('messages.routes')
	// =========================================================================
	//
	// Controller for the master list of messagetemplates
	//
	// =========================================================================
	.controller ('MessageTemplatesListController', function (templates, Authentication) {
		var vm         = this;
		vm.templates = templates;
	})
	// =========================================================================
	//
	// Controller the view of the template page
	//
	// =========================================================================
	.controller ('MessageTemplateViewController', function ($sce, $state, template, Authentication, Notification) {
		var vm                 = this;
		vm.trust               = $sce.trustAsHtml;
		vm.template          = template;
		vm.auth                = Authentication;
		vm.canEdit              = Authentication.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the template page
	//
	// =========================================================================
	.controller ('MessageTemplateEditController', function ($scope, $state, template, Authentication, Notification) {
		var qqq        = this;
		qqq.template = template;
		qqq.auth       = Authentication;
		// -------------------------------------------------------------------------
		//
		// save the template, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid, leavenow) {
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.superbasicForm');
				return false;
			}
			//
			// Create a new template, or update the current instance
			//
			qqq.template.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.superbasicForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> template saved successfully!'
				});
				if (leavenow) $state.go ('messagetemplates.view', {superbasicId:qqq.template.code});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> template save error!'
				});
			});
		};
	})
	;
}());
