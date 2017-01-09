(function () {
	'use strict';
	angular.module('opportunities')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('OpportunitiesListController', function (OpportunitiesService) {
		var vm      = this;
		vm.opportunities = OpportunitiesService.query();
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewController', function ($scope, $state, $stateParams, opportunity, Authentication, OpportunitiesService, Notification) {
		var vm                  = this;
		vm.projectId            = $stateParams.projectId;
		vm.opportunity          = opportunity;
		vm.authentication       = Authentication;
		vm.OpportunitiesService = OpportunitiesService;
		vm.idString             = 'opportunityId';
		vm.showMember           = Authentication.user && !opportunity.userIs.gov && !opportunity.userIs.member && !opportunity.userIs.request;
		vm.request              = function () {
			OpportunitiesService.makeRequest({
				opportunityId: opportunity._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Successfully Applied!' });
			})
		};
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityEditController', function ($scope, $state, $stateParams, $window, opportunity, editing, programs, projects, Authentication, Notification) {
		var vm         = this;
		vm.projects    = projects;
		vm.programs    = programs;
		vm.projectId   = $stateParams.projectId;
		vm.editing     = editing;
		vm.opportunity = opportunity;
		vm.projectId   = (opportunity.project && opportunity.project)? opportunity.project._id : null;
		vm.programId   = (opportunity.program && opportunity.program)? opportunity.program._id : null;
		if (!vm.editing) {
			vm.opportunity.project = $stateParams.projectId;
		}
		vm.authentication = Authentication;
		vm.form           = {};
		vm.opportunity.skilllist = vm.opportunity.skills ? vm.opportunity.skills.join (', ') : '';
		vm.opportunity.taglist   = vm.opportunity.tags   ? vm.opportunity.tags.join (', ')   : '';
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
			console.log ('saving form', vm.opportunity);
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
				return false;
			}
			vm.opportunity.tags   = vm.opportunity.taglist.split(/ *, */);
			vm.opportunity.skills = vm.opportunity.skilllist.split(/ *, */);
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
