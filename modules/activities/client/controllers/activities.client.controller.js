(function () {
	'use strict';
	angular.module('activities')
	// =========================================================================
	//
	// Controller the view of the activity page
	//
	// =========================================================================
	.controller('ActivityViewController', function ($scope, $state, activity, Authentication, ActivitiesService) {
		var vm            = this;
		vm.activity        = activity;
		vm.authentication = Authentication;
		vm.showMember     = activity.userIs.gov && !activity.userIs.member && !activity.userIs.request;
		vm.request = function () {
			ActivitiesService.makeRequest({
				activityId: activity._id
			}).$promise.then (function () {
				console.log ('Oh yeah, all done');
			})
		};
	})
	// =========================================================================
	//
	// Controller the view of the activity page
	//
	// =========================================================================
	.controller('ActivityEditController', function ($scope, $state, $window, activity, editing, Authentication, Notification) {
		var vm            = this;
		vm.editing        = editing;
		vm.activity        = activity;
		vm.authentication = Authentication;
		vm.form           = {};
		// -------------------------------------------------------------------------
		//
		// remove the activity with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.activity.$remove(function() {
					$state.go('activities.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> activity deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the activity, could be added or edited (post or put)
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
			// Create a new activity, or update the current instance
			//
			vm.activity.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (res) {
				console.log ('now saved the new activity, redirect user');
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> activity saved successfully!'
				});
				if (editing) {
					$state.go('activities.view', {activityId:activity._id});
				} else {
					$state.go('activities.list');
				}
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> activity save error!'
				});
			});
		};
	})
	;
}());
