// =========================================================================
//
// All the client side routes for notifications
//
// =========================================================================
(function () {
	'use strict';

	angular.module('notifications.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all notification routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('notifications', {
			abstract: true,
			url: '/notifications',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// notification listing. Resolve to all notifications in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('notifications.list', {
			url: '',
			templateUrl: '/modules/notifications/client/views/list-notifications.client.view.html',
			data: {
				pageTitle: 'Notifications List'
			},
			ncyBreadcrumb: {
				label: 'All notifications'
			},
			resolve: {
				notifications: function ($stateParams, NotificationsService) {
					return NotificationsService.query ();
				}
			},
			controller: 'NotificationsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a notification, resolve the notification data
		//
		// -------------------------------------------------------------------------
		.state('notifications.view', {
			url: '/:notificationId',
			params: {
				programId: null
			},
			templateUrl: '/modules/notifications/client/views/view-notification.client.view.html',
			controller: 'NotificationViewController',
			controllerAs: 'vm',
			resolve: {
				notification: function ($stateParams, NotificationsService) {
					return NotificationsService.get({
						notificationId: $stateParams.notificationId
					}).$promise;
				},
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				},
				subscriptions: function ($stateParams, NotificationsService) {
					return NotificationsService.subscriptionsForNotification ({
						notificationId: $stateParams.notificationId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Notification: {{ notification.name }}'
			},
			ncyBreadcrumb: {
				label: '{{vm.notification.name}}',
				parent: 'notifications.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('notificationadmin', {
			abstract: true,
			url: '/notificationadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a notification
		//
		// -------------------------------------------------------------------------
		.state('notificationadmin.edit', {
			url: '/:notificationId/edit',
			params: {
				context: null
			},
			templateUrl: '/modules/notifications/client/views/edit-notification.client.view.html',
			controller: 'NotificationEditController',
			controllerAs: 'vm',
			resolve: {
				notification: function ($stateParams, NotificationsService) {
					return NotificationsService.get({
						notificationId: $stateParams.notificationId
					}).$promise;
				},
				editing: function () { return true; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				},
				subscriptions: function ($stateParams, NotificationsService) {
					return NotificationsService.subscriptionsForNotification ({
						notificationId: $stateParams.notificationId
					}).$promise;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Notification {{ notification.name }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Notification',
				parent: 'notifications.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new notification and edit it
		//
		// -------------------------------------------------------------------------
		.state('notificationadmin.create', {
			url: '/create',
			params: {
				programId: null,
				programTitle: null,
				context: null
			},
			templateUrl: '/modules/notifications/client/views/edit-notification.client.view.html',
			controller: 'NotificationEditController',
			controllerAs: 'vm',
			resolve: {
				notification: function (NotificationsService) {
					return new NotificationsService();
				},
				programs: function (ProgramsService) {
					return ProgramsService.myadmin ().$promise;
				},
				editing: function () { return false; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Notification'
			},
			ncyBreadcrumb: {
				label: 'New Notification',
				parent: 'notifications.list'
			}
		})
		;
	}]);
}());


