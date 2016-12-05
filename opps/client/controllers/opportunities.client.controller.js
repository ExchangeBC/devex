(function () {
	'use strict';
	angular.module('opportunities')
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewController', function ($scope, $state, opportunity, Authentication, OpportunitiesService) {
		var vm            = this;
		vm.opportunity        = opportunity;
		vm.authentication = Authentication;
		vm.showMember     = opportunity.userIs.gov && !opportunity.userIs.member && !opportunity.userIs.request;
		vm.request = function () {
			OpportunitiesService.makeRequest({
				opportunityId: opportunity._id
			}).$promise.then (function () {
				console.log ('Oh yeah, all done');
			})
		};
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityEditController', function ($scope, $state, $window, opportunity, editing, Authentication, Notification) {
		var vm            = this;
		vm.editing        = editing;
		vm.opportunity        = opportunity;
		vm.authentication = Authentication;
		vm.form           = {};
		// -------------------------------------------------------------------------
		//
		// remove the opportunity with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.opportunity.$remove(function() {
					$state.go('opportunities.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> opportunity deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the opportunity, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			console.log ('saving form');
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
				return false;
			}
			//
			// Create a new opportunity, or update the current instance
			//
			vm.opportunity.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (res) {
				console.log ('now saved the new opportunity, redirect user');
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> opportunity saved successfully!'
				});
				if (editing) {
					$state.go('opportunities.view', {opportunityId:opportunity._id});
				} else {
					$state.go('opportunities.list');
				}
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> opportunity save error!'
				});
			});
		};
	})
	;
}());
