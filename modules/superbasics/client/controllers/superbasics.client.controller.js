(function () {
	'use strict';
	angular.module ('superbasics')
	// =========================================================================
	//
	// Controller for the master list of superbasics
	//
	// =========================================================================
	.controller ('SuperbasicsListController', function (SuperbasicsService, superbasics) {
		var vm         = this;
		vm.superbasics = superbasics;
		var isUser     = vm.isUser  = Authentication.user;
		var isAdmin    = vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov      = vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.canAdd      = vm.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the superbasic page
	//
	// =========================================================================
	.controller ('SuperbasicViewController', function ($scope, $state, $sce, $stateParams, superbasic, Authentication, SuperbasicsService, Notification) {
		var vm                 = this;
		vm.superbasic          = superbasic;
		vm.display             = {};
		vm.display.description = $sce.trustAsHtml (vm.superbasic.description);
		vm.auth                = Authentication;
		vm.canEdit             = Authentication.isAdmin;
	// =========================================================================
	//
	// Controller the view of the superbasic page
	//
	// =========================================================================
	.controller ('SuperbasicEditController', function ($scope, $window, $state, $uibModalInstance, superbasic, org, allusers, Authentication, Notification) {
		var qqq             = this;
		qqq.superbasic         = superbasic;
		if (!qqq.superbasic.org) qqq.superbasic.org = org._id;
		console.log (superbasic);
		qqq.superbasicForm = {};
		if (!qqq.superbasic.members) qqq.superbasic.members = [];
		qqq.removals = [];
		qqq.additions = [];
		qqq.allusers = [];
		var availableusers = [];
		var pristine = angular.copy (qqq.superbasic);
		qqq.people = [];
		var memberHash = qqq.superbasic.members.reduce (function (accum, current) {accum[current._id] = current;return accum;}, {});
		var peopleHash = allusers.reduce (function (accum, current) {
			accum[current._id] = current;
			if (!memberHash[current._id]) qqq.allusers.push (current);
			return accum;
		}, {});
		console.log ('member hash', memberHash);
		console.log ('people hash', peopleHash);
		console.log ('allusers', qqq.allusers);
		console.log ('allusers', allusers);
		// -------------------------------------------------------------------------
		//
		// remove the superbasic with some confirmation
		//
		// -------------------------------------------------------------------------
		qqq.remove = function () {
			if ($window.confirm ('Are you sure you want to delete?')) {
				qqq.superbasic.$remove (function () {
					$state.go ('superbasics.list');
					Notification.success ({ message: '<i class="glyphicon glyphicon-ok"></i> superbasic deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// add or remove members
		//
		// -------------------------------------------------------------------------
		qqq.addPerson = function () {
			console.log ('add Person');
			if (qqq.additions.length) {
				qqq.superbasic.members = addElements (qqq.superbasic.members, qqq.additions, peopleHash);
				qqq.allusers = removeElements (qqq.allusers, qqq.additions);
				qqq.additions = [];
			}
		};
		qqq.remPerson = function () {
			console.log ('remove person');
			if (qqq.removals.length) {
				qqq.allusers = addElements (qqq.allusers, qqq.removals, peopleHash);
				qqq.superbasic.members = removeElements (qqq.superbasic.members, qqq.removals);
				qqq.removals = [];
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the superbasic, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid) {
			qqq.superbasicForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.superbasicForm');
				return false;
			}
			//
			// Create a new superbasic, or update the current instance
			//
			console.log ('qqq.superbasic', qqq.superbasic);
			qqq.superbasic.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.superbasicForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> superbasic saved successfully!'
				});
				$uibModalInstance.close (qqq.superbasic);
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
		// -------------------------------------------------------------------------
		//
		// leave and set back to normal
		//
		// -------------------------------------------------------------------------
		qqq.quitnow = function () {
			superbasic = pristine;
			$uibModalInstance.dismiss ('cancel');
		};
	})
	.controller ('SuperbasicPickController', function ($scope, $window, $state, $uibModalInstance, superbasic, org, allusers, Authentication, Notification) {
	})
	;
}());
