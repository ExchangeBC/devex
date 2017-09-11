(function () {
	'use strict';
	angular.module ('notifications')
	// -------------------------------------------------------------------------
	//
	// directive for listing notifications
	//
	// -------------------------------------------------------------------------
	.directive ('notificationList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/notifications/client/views/list.notifications.directive.html',
			controller   : function ($scope, NotificationsService, Authentication, Notification) {
				var vm     = this;
				vm.program = $scope.program;
				vm.context = $scope.context;
				var isUser = Authentication.user;
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
				vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
				if (vm.context === 'program') {
					vm.programId = vm.program._id;
					vm.programTitle = vm.program.title;
				} else {
					vm.programId = null;
					vm.programTitle = null;
				}
				//
				// if a program is supplied, then only list notifications under it
				// also allow adding a new notification (because it has context)
				//
				if ($scope.program) {
					vm.title      = 'Notifications for '+$scope.program.title;
					vm.programId  = $scope.program._id;
					vm.userCanAdd = $scope.program.userIs.admin || vm.isAdmin;
					vm.notifications   = NotificationsService.forProgram ({
						programId: $scope.program._id
					});
					vm.columnCount = 1;
				} else {
					vm.title      = 'All Notifications';
					vm.programId  = null;
					vm.userCanAdd = (vm.isAdmin || vm.isGov);
					vm.notifications   = NotificationsService.query ();
					vm.columnCount = 1;
				}
				if ($scope.title) vm.title = $scope.title;
				vm.publish = function (notification, state) {
					var publishedState = notification.isPublished;
					var t = state ? 'Published' : 'Un-Published'
					notification.isPublished = state;
					notification.createOrUpdate ()
					//
					// success, notify and return to list
					//
					.then (function () {
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> Notification '+t+' Successfully!'
						});
					})
					//
					// fail, notify and stay put
					//
					.catch (function (res) {
						notification.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Notification '+t+' Error!'
						});
					});
				};
				vm.request = function (notification) {
					NotificationsService.makeRequest ({
						notificationId: notification._id
					}).$promise
					.then (function () {
						notification.userIs.request = true;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
					})
					.catch (function (res) {
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Membership Request Error!'
						});
					});
				};
			}
		}
	})
	;
}());
