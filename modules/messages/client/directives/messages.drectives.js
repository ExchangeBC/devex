(function () {
	'use strict';
	angular.module ('messages')
	// -------------------------------------------------------------------------
	//
	// directive for listing messages
	//
	// -------------------------------------------------------------------------
	.directive ('messageList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				context   : '@'
			},
			templateUrl  : '/modules/messages/client/views/message-list.html',
			controller   : function ($sce, $rootScope, $scope, MessagesService, Authentication, $location) {
				var vm        = this;
				vm.trust      = $sce.trustAsHtml;
				vm.auth       = Authentication.permissions ();
				vm.context    = $scope.context;
				//
				// filtering the list
				//
				if (!window.messageFilter) {
					window.messageFilter = {
						open: true,
						archived: false
					};
				}
				vm.filter = window.messageFilter;
				vm.changeFilterO = function () {
					console.log ('open:',vm.filter.open);
					console.log ('archived:',vm.filter.archived);
					vm.filter.archived = !vm.filter.open;
					vm.reset ();
				}
				vm.changeFilter = function () {
					console.log ('open:',vm.filter.open);
					console.log ('archived:',vm.filter.archived);
					vm.filter.open = !vm.filter.archived;
					vm.reset ();
				}
				//
				// reset the page
				//
				vm.reset = function () {
					//
					// in future we may nbeed to have a context of user or company in order
					// to see messages sent by a company, but we still need business rules
					//
					if (vm.filter.open) {
						vm.messages = MessagesService.my ();
					} else {
						vm.messages = MessagesService.myarchived ();
					}
				}
				//
				// take some sort of action
				//
				vm.takeAction = function (messageId, action) {
					console.log ('takeaction', messageId, action);
					// if (isDefault) {
					// 	$event.stopPropagation();
					// 	$event.preventDefault();
					// }
					MessagesService.actioned ({
						messageId: messageId,
						action : action.actionCd
					}).$promise.then (function () {
						if (!action.isDefault) {
							$location.path (action.link);
						}
						else $rootScope.$broadcast('updateMessages', 'done');
					})
				}
				//
				// if changes occur
				//
				$rootScope.$on ('updateMessages', function () {
					vm.reset ();
				});
				vm.reset ();
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for viewing a message, could have several different modes
	//
	// -------------------------------------------------------------------------
	.directive ('messageView', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				message : '='
			},
			templateUrl  : '/modules/messages/client/views/view.message.directive.html',
			controller   : function ($scope, Authentication) {
				var vm        = this;
				vm.auth       = Authentication;
				vm.mode       = $scope.mode || 'page';
				vm.canEdit    = vm.auth.isAdmin;
				vm.message = $scope.message;
			}
		}

	})
	;
}());

