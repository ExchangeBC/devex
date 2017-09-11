// Notifications service used to communicate Notifications REST endpoints
(function () {
	'use strict';

	angular
		.module('notifications')
		.factory('NotificationsService', NotificationsService);

	NotificationsService.$inject = ['$resource', '$log'];

	function NotificationsService($resource, $log) {
		var Notification = $resource('/api/notifications/:notificationId', {
			notificationId: '@_id'
		}, {
			update: {
				method: 'PUT'
			},
			subscriptions: {
				method: 'GET',
				url: '/api/my/subscriptions',
				isArray: true
			},
			subscriptionsForUser: {
				method: 'GET',
				url: '/api/subscriptions/user/:userId',
				isArray: true
			},
			subscriptionsForNotification: {
				method: 'GET',
				url: '/api/subscriptions/notification/:notificationId',
				isArray: true
			},
			subscription: {
				method: 'GET',
				url: '/api/my/subscriptions/:subscriptionId',
				isArray: false
			},
			unsubscribe: {
				method: 'DELETE',
				url: '/api/my/subscriptions/:subscriptionId',
				isArray: false
			},
			subscribeNotification: {
				method: 'GET',
				url: '/api/my/notification/:notificationId',
				isArray: false
			},
			unsubscribeNotification: {
				method: 'DELETE',
				url: '/api/my/notification/:notificationId',
				isArray: false
			}
		});

		angular.extend(Notification.prototype, {
			createOrUpdate: function () {
				var notification = this;
				return createOrUpdate(notification);
			}
		});
		return Notification;

		function createOrUpdate(notification) {
			if (notification._id) {
				return notification.$update(onSuccess, onError);
			} else {
				return notification.$save(onSuccess, onError);
			}

			// Handle successful response
			function onSuccess() {
				// Any required internal processing from inside the service, goes here.
			}

			// Handle error response
			function onError(errorResponse) {
				var error = errorResponse.data;
				// Handle error internally
				handleError(error);
			}

			function handleError(error) {
				// Log error
				$log.error(error);
			}
		}
	}
}());
