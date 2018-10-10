(function () {
	'use strict';
	angular.module ('core')
	// -------------------------------------------------------------------------
	//
	// directive for listing model members
	//
	// -------------------------------------------------------------------------
	.directive ('coreMemberList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				model: '=',
				service: '=',
				idstring: '=',
				title: '@'
			},
			templateUrl  : '/modules/core/client/views/members.directive.html',
			controller   : ['$scope', '$rootScope', 'Authentication', function ($scope, $rootScope, Authentication) {
				var vm = this;
				var isUser = Authentication.user;
				vm.isUser = isUser ;
				vm.userid  = isUser ? Authentication.user.username : 'Guest';
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');vm.model = $scope.model;
				vm.model = $scope.model;
				vm.title = $scope.title || 'Members';
				var modelService = $scope.service;
				var queryObject = {};
				var reset = function () {
					queryObject = {};
					queryObject[$scope.idstring] = $scope.model._id;
					modelService.getMembers (queryObject).$promise.then (function (result) {
						vm.members = result;
						var columnLength = Math.floor (result.length / 2) + (result.length % 2);
						vm.columns = [{
							start : 0,
							end   : columnLength
						},{
							start : columnLength,
							end   : result.length
						}];
					});
				}
				vm.delete = function (userid, username, type) {
					var adminMessage = 'Are you sure you want to remove '+username+' (this member)?';
					var userMessage = 'Are you sure you want to remove yourself from this membership list?';
					var message = (type === 'admin') ? adminMessage : userMessage;
					if (confirm (message)) {
						queryObject.userId = userid;
						modelService.denyMember (queryObject).$promise.then (function () {
							$rootScope.$broadcast('updateMembers', 'done');
						});
					}
				};
				$rootScope.$on('updateMembers', function () {
					reset ();
				});
				reset ();
			}]
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing model member requests
	//
	// -------------------------------------------------------------------------
	.directive ('coreMemberRequests', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				model: '=',
				service: '=',
				idstring: '=',
				title: '@'
			},
			templateUrl  : '/modules/core/client/views/member.requests.directive.html',
			controller   : ['$scope', '$rootScope', 'Authentication', function ($scope, $rootScope, Authentication) {
				var vm = this;
				var isUser                 = Authentication.user;
				vm.isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');vm.model = $scope.model;
				vm.title = $scope.title || 'Member Requests';
				var modelService = $scope.service;
				var queryObject = {};
				var reset = function () {
					queryObject = {};
					queryObject[$scope.idstring] = $scope.model._id;
					modelService.getRequests (queryObject).$promise.then (function (result) {
						vm.members = result;
						var columnLength = Math.floor (result.length / 2) + (result.length % 2);
						vm.columns = [{
							start : 0,
							end   : columnLength
						},{
							start : columnLength,
							end   : result.length
						}];
					});
				}
				vm.confirm = function (userid) {
					queryObject.userId = userid;
					modelService.confirmMember (queryObject).$promise.then (function () {
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				vm.deny = function (userid) {
					queryObject.userId = userid;
					modelService.denyMember (queryObject).$promise.then (function () {
						$rootScope.$broadcast('updateMembers', 'done');
					});
				};
				$rootScope.$on('updateMembers', function () {
					reset ();
				});
				reset ();
			}]
		}
	})

	.filter ('slice', function () {
		return function(arr, start, end) {
			if (! arr || ! arr.slice) return;
			return arr.slice(start, end);
		};
	})

	.filter('columnRanges', function() {
		var memo = [];
		return function(items, count) {
			if (count < 1) count = 1;
			var itemlen = items ? items.length : 0,
				len = (count === 1) ? itemlen : Math.floor(itemlen / count) + (itemlen % count);
			if (! memo[count])
				memo[count] = [];
			if (! memo[count][len]) {
				var arr = [],
					i = 0,
					start = 0;
				if (itemlen) {
					for (; i < count; i++) {
						arr.push({start: start, end: Math.min(start + len, itemlen)});
						start += len;
					}
				}
				memo[count][len] = arr;
			}
			return memo[count][len];
		}
	});


}());
