(function () {
	'use strict';
	angular.module('notifications')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('NotificationsListController', function (NotificationsService) {
		var vm      = this;
		vm.notifications = NotificationsService.query();
	})
	// =========================================================================
	//
	// Controller the view of the notification page
	//
	// =========================================================================
	.controller('NotificationViewController', function ($scope, $state, $sce, $stateParams, notification, Authentication, NotificationsService, Notification) {
		var vm                 = this;
		vm.programId           = notification.program ? notification.program._id : $stateParams.programId;
		vm.notification             = notification;
		vm.display             = {};
		vm.display.description = $sce.trustAsHtml(vm.notification.description);
		vm.authentication      = Authentication;
		vm.NotificationsService     = NotificationsService;
		vm.idString            = 'notificationId';
		//
		// what can the user do here?
		//
		var isUser                 = Authentication.user;
		var isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov                  = isUser && !!~Authentication.user.roles.indexOf ('gov');
		var isMemberOrWaiting      = notification.userIs.member || notification.userIs.request;
		vm.isAdmin                 = isAdmin;
		vm.loggedIn                = isUser;
		vm.canRequestMembership    = isGov && !isMemberOrWaiting;
		vm.canEdit                 = isAdmin || notification.userIs.admin;
		// console.log ('vm = ', vm);
		// -------------------------------------------------------------------------
		//
		// issue a request for membership
		//
		// -------------------------------------------------------------------------
		vm.request = function () {
			NotificationsService.makeRequest({
				notificationId: notification._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
			});
		};
		// -------------------------------------------------------------------------
		//
		// publish or un publish the opportunity
		//
		// -------------------------------------------------------------------------
		vm.publish = function (state) {
			var publishedState = notification.isPublished;
			var t = state ? 'Published' : 'Un-Published'
			notification.isPublished = state;
			notification.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (res) {
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
	})
	// =========================================================================
	//
	// Controller the view of the notification page
	//
	// =========================================================================
	.controller('NotificationEditController', function ($scope, $state, $sce, $stateParams, $window, notification, editing, programs, Authentication, Notification, previousState) {
		var vm             = this;
		vm.previousState   = previousState;
		vm.isAdmin         = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.isNotificationAdmin  = (vm.editing) ? notification.userIs.admin : true;
		vm.notification         = notification;
		vm.authentication  = Authentication;
		//
		// if the user doesn't have the right access then kick them out
		//
		if (editing && !vm.isAdmin && !notification.userIs.admin) $state.go('forbidden');
		vm.form            = {};
		vm.notification.taglist = vm.notification.tags? vm.notification.tags.join (', ') : '';
		vm.editing         = editing;
		vm.context         = $stateParams.context;
		vm.programs        = programs;
		vm.tinymceOptions  = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     :'',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		if (vm.programs.length === 0) {
			alert ('You do not have a program for which you are able to create a notification. Please browse to or create a program to put the new notification under.');
			$state.go (previousState.name, previousState.params);
		}
		//
		// if adding we care about the context
		// if editing, the program field is locked (and is just a link)
		// if adding then the user is restricted to add under a program they have
		// admin over. If adding wihin the context of a program then restrict to
		// that program only
		//
		//
		// defaults
		//
		vm.programLink  = true;
		vm.programId    = $stateParams.programId;
		vm.programTitle = $stateParams.programTitle;
		//
		// if editing, set from existing
		//
		if (vm.editing) {
			vm.programId    = notification.program._id;
			vm.programTitle = notification.program.title;
		} else {
			//
			// if adding with no program context display select box
			//
			if (vm.context === 'allnotifications') {
				vm.programLink = false;
			}
			//
			// if adding with program context set the program on the record
			//
			else if (vm.context === 'program') {
				vm.notification.program = vm.programId;
			}
			// vm.form.notificationForm.$setPristine ();
		}
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
			if (vm.notification.taglist !== '') {
				vm.notification.tags = vm.notification.taglist.split(/ *, */);
			} else {
				vm.notification.tags = [];
			}
			//
			// if we were adding, then set the selected programId, unless it was adding inside
			// a program context already, then just use the one that is already set
			//
			if (!editing && vm.context === 'allnotifications') {
				vm.notification.program = vm.programId;
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
// (function () {
// 	'use strict';

// 	// Notifications controller
// 	angular.module('notifications')
// 		.controller('NotificationsController', NotificationsController);

// 	NotificationsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'notificationResolve'];

// 	function NotificationsController ($scope, $state, $window, Authentication, notification) {
// 		var vm = this;

// 		vm.authentication = Authentication;
// 		vm.notification = notification;
// 		vm.error = null;
// 		vm.form = {};
// 		vm.remove = remove;
// 		vm.save = save;

// 		// Remove existing Notification
// 		function remove() {
// 			if ($window.confirm('Are you sure you want to delete?')) {
// 				vm.notification.$remove($state.go('notifications.list'));
// 			}
// 		}

// 		// Save Notification
// 		function save(isValid) {
// 			if (!isValid) {
// 				$scope.$broadcast('show-errors-check-validity', 'vm.form.notificationForm');
// 				return false;
// 			}

// 			// TODO: move create/update logic to service
// 			if (vm.notification._id) {
// 				vm.notification.$update(successCallback, errorCallback);
// 			} else {
// 				vm.notification.$save(successCallback, errorCallback);
// 			}

// 			function successCallback(res) {
// 				$state.go('notifications.view', {
// 					notificationId: res._id
// 				});
// 			}

// 			function errorCallback(res) {
// 				vm.error = res.data.message;
// 			}
// 		}
// 	}
// });
