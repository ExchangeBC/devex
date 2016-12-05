(function () {
	'use strict';
	angular.module('opportunities')
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewController', function ($scope, $state, $stateParams, opportunity, Authentication, OpportunitiesService) {
		var vm            = this;
		vm.projectId      = $stateParams.projectId;
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
	.controller('OpportunityEditController', function ($scope, $state, $stateParams, $window, opportunity, editing, Authentication, Notification) {
		var vm            = this;
		vm.projectId      = $stateParams.projectId;
		vm.editing        = editing;
		vm.opportunity        = opportunity;
		if (!vm.editing) {
			vm.opportunity.project = $stateParams.projectId;
		}
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
			console.log ('saving form', vm.opportunity);
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
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
// (function () {
// 	'use strict';

// 	// Opportunities controller
// 	angular.module('opportunities')
// 		.controller('OpportunitiesController', OpportunitiesController);

// 	OpportunitiesController.$inject = ['$scope', '$state', '$window', 'Authentication', 'opportunityResolve'];

// 	function OpportunitiesController ($scope, $state, $window, Authentication, opportunity) {
// 		var vm = this;

// 		vm.authentication = Authentication;
// 		vm.opportunity = opportunity;
// 		vm.error = null;
// 		vm.form = {};
// 		vm.remove = remove;
// 		vm.save = save;

// 		// Remove existing Opportunity
// 		function remove() {
// 			if ($window.confirm('Are you sure you want to delete?')) {
// 				vm.opportunity.$remove($state.go('opportunities.list'));
// 			}
// 		}

// 		// Save Opportunity
// 		function save(isValid) {
// 			if (!isValid) {
// 				$scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
// 				return false;
// 			}

// 			// TODO: move create/update logic to service
// 			if (vm.opportunity._id) {
// 				vm.opportunity.$update(successCallback, errorCallback);
// 			} else {
// 				vm.opportunity.$save(successCallback, errorCallback);
// 			}

// 			function successCallback(res) {
// 				$state.go('opportunities.view', {
// 					opportunityId: res._id
// 				});
// 			}

// 			function errorCallback(res) {
// 				vm.error = res.data.message;
// 			}
// 		}
// 	}
// });
