(function () {
	'use strict';
	angular.module ('superbasics')
	// =========================================================================
	//
	// Controller for the master list of superbasics
	//
	// =========================================================================
	.controller ('SuperbasicsListController', function (superbasics, Authentication) {
		var vm         = this;
		vm.superbasics = superbasics;
	})
	// =========================================================================
	//
	// Controller the view of the superbasic page
	//
	// =========================================================================
	.controller ('SuperbasicViewController', function ($sce, $state, superbasic, Authentication, Notification) {
		var vm                 = this;
		vm.trust               = $sce.trustAsHtml;
		vm.superbasic          = superbasic;
		vm.auth                = Authentication;
		vm.canEdit              = Authentication.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the superbasic page
	//
	// =========================================================================
	.controller ('SuperbasicEditController', function ($scope, $state, superbasic, Authentication, Notification) {
		var qqq        = this;
		qqq.superbasic = superbasic;
		qqq.auth       = Authentication;
		// -------------------------------------------------------------------------
		//
		// save the superbasic, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid, leavenow) {
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.superbasicForm');
				return false;
			}
			//
			// Create a new superbasic, or update the current instance
			//
			qqq.superbasic.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.superbasicForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> superbasic saved successfully!'
				});
				if (leavenow) $state.go ('superbasics.view', {superbasicId:qqq.superbasic.code});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> superbasic save error!'
				});
			});
		};
	})
	;
}());
