(function () {
	'use strict';
	angular.module('notifications')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('NotificationsListController', function (notifications) {
		var vm      = this;
		vm.notifications = notifications; // NotificationsService.query();
	})
	// =========================================================================
	//
	// Controller the view of the notification page
	//
	// =========================================================================
	.controller('NotificationViewController', function ($scope, $state, $sce, $stateParams, notification, Authentication, NotificationsService, Notification, previousState, subscriptions) {
		var vm                  = this;
		vm.subscriptions = subscriptions;
		vm.notification         = notification;
		vm.previousState   = previousState;
		vm.authentication       = Authentication;
		vm.NotificationsService = NotificationsService;
		vm.idString             = 'notificationId';
	})
	// =========================================================================
	//
	// Controller the view of the notification page
	//
	// =========================================================================
	.controller('NotificationEditController', function ($scope, $state, $sce, $stateParams, $window, notification, editing, NotificationsService, Authentication, Notification, previousState, subscriptions) {
		var vm             = this;
		vm.subscriptions = subscriptions;
		vm.previousState   = previousState;
		vm.notification    = notification;
		vm.authentication  = Authentication;
		vm.editing = editing;
		// -------------------------------------------------------------------------
		//
		// remove the notification with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.notification.$remove(function() {
					$state.go('notifications.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> notification deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// remove a subscription
		//
		// -------------------------------------------------------------------------
		vm.unsubscribe = function (subscriptionId) {
			if ($window.confirm('Are you sure you want to unsubscribe this user from this Notification?')) {
				NotificationsService.unsubscribe ({subscriptionId: subscriptionId},  function() {
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> notification deleted successfully!' });
					NotificationsService.subscriptionsForNotification ({
						notificationId: vm.notification._id
					}, function (result) {
						vm.subscriptions = result;
					})
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the notification, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			vm.form.notificationForm.$setPristine ();
			// console.log ('saving form', vm.notification);
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.notificationForm');
				return false;
			}
			//
			// Create a new notification, or update the current instance
			//
			vm.notification.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (res) {
				vm.form.notificationForm.$setPristine ();
				// console.log ('now saved the new notification, redirect user');
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> notification saved successfully!'
				});
				if (editing) {
					$state.go('notifications.view', {notificationId:notification.code});
				} else {
					// $state.go('notifications.list');
					$state.go('notifications.view', {notificationId:notification.code});
				}
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> notification save error!'
				});
			});
		};
	})
	;
}());
