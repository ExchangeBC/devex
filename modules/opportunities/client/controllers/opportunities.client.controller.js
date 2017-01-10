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
	.controller('OpportunityEditController', function ($scope, $state, $stateParams, $window, $sce, opportunity, editing, projects, Authentication, Notification) {
		var vm         = this;
		vm.projects    = projects;
		vm.editing     = editing;
		vm.opportunity = opportunity;
		vm.authentication = Authentication;
		vm.form           = {};
		vm.opportunity.skilllist = vm.opportunity.skills ? vm.opportunity.skills.join (', ') : '';
		vm.opportunity.taglist   = vm.opportunity.tags   ? vm.opportunity.tags.join (', ')   : '';
		//
		// do we have existing contexts for program and project ?
		// deal with all that noise right here
		//
		vm.projectLink  = true;
		vm.programId    = $stateParams.programId;
		vm.programTitle = $stateParams.programTitle;
		vm.projectId    = $stateParams.projectId;
		vm.projectTitle = $stateParams.projectTitle;
		//
		// if editing, set from existing
		//
		if (vm.editing) {
			vm.programId    = opportunity.program._id;
			vm.programTitle = opportunity.program.title;
			vm.projectId    = opportunity.project._id;
			vm.projectTitle = opportunity.project.name;
		}
		else {
			if (vm.context === 'allopportunities') {
				vm.projectLink  = false;
			}
			else if (vm.context === 'program') {
				vm.projectLink  = false;
				vm.opportunity.program = vm.programId;
			}
			else if (vm.context === 'project') {
				vm.projectLink  = true;
				vm.opportunity.project = vm.projectId;
				vm.opportunity.program = vm.programId;
			}
		}
		// -------------------------------------------------------------------------
		//
		// this is used when we are setting the entire hierarchy from the project
		// select box
		//
		// -------------------------------------------------------------------------
		vm.updateProgramProject = function () {
			vm.projectId    = vm.project._id;
			vm.projectTitle = vm.project.name;
			vm.programId    = vm.project.program.project._id;
			vm.programTitle = vm.project.program.project.title;
		};
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
			// if any context pieces were being set then copy in to the
			// right place here
			//
			if (!vm.editing) {
				if (vm.context === 'allopportunities') {
					vm.opportunity.project = vm.projectId;
					vm.opportunity.program = vm.programId;
				}
				else if (vm.context === 'program') {
					vm.opportunity.project = vm.projectId;
				}
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
		vm.popoverCache = {};
		vm.popoverContent       = function(field) {
			if (! field) return;
			if (! vm.popoverCache[field]) {
				var help = $('#opportunityForm').find('.input-help[data-field='+field+']'),
					html = '';
				if (help.length)
					html = help.html();
				vm.popoverCache[field] = $sce.trustAsHtml(html);
			}
			return vm.popoverCache[field];
		};
	})
	;
}());
