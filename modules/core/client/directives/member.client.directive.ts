(() => {
	'use strict';
	angular
		.module('core')
		// -------------------------------------------------------------------------
		//
		// directive for listing model members
		//
		// -------------------------------------------------------------------------
		.directive('coreMemberList', () => {
			return {
				restrict: 'E',
				controllerAs: 'vm',
				scope: {
					model: '=',
					service: '=',
					idstring: '=',
					title: '@'
				},
				templateUrl:
					'/modules/core/client/views/members.directive.html',
				controller: [
					'$scope',
					'$rootScope',
					'Authentication',
					function($scope, $rootScope, Authentication) {
						const vm = this;
						const isUser = Authentication.user;
						vm.isUser = isUser;
						vm.userid = isUser
							? Authentication.user.username
							: 'Guest';
						vm.isAdmin =
							isUser &&
							Authentication.user.roles.indexOf('admin') !== -1;
						vm.model = $scope.model;
						vm.title = $scope.title || 'Members';
						const modelService = $scope.service;
						let queryObject: any = {};
						const reset = () => {
							queryObject = {};
							queryObject[$scope.idstring] = $scope.model._id;
							modelService
								.getMembers(queryObject)
								.$promise.then(result => {
									vm.members = result;
									const columnLength =
										Math.floor(result.length / 2) +
										(result.length % 2);
									vm.columns = [
										{
											start: 0,
											end: columnLength
										},
										{
											start: columnLength,
											end: result.length
										}
									];
								});
						};
						vm.delete = (userid, username, type) => {
							const adminMessage =
								'Are you sure you want to remove ' +
								username +
								' (this member)?';
							const userMessage =
								'Are you sure you want to remove yourself from this membership list?';
							const message =
								type === 'admin' ? adminMessage : userMessage;
							if (confirm(message)) {
								queryObject.userId = userid;
								modelService
									.denyMember(queryObject)
									.$promise.then(() => {
										$rootScope.$broadcast(
											'updateMembers',
											'done'
										);
									});
							}
						};
						$rootScope.$on('updateMembers', () => {
							reset();
						});
						reset();
					}
				]
			};
		})
		// -------------------------------------------------------------------------
		//
		// directive for listing model member requests
		//
		// -------------------------------------------------------------------------
		.directive('coreMemberRequests', () => {
			return {
				restrict: 'E',
				controllerAs: 'vm',
				scope: {
					model: '=',
					service: '=',
					idstring: '=',
					title: '@'
				},
				templateUrl:
					'/modules/core/client/views/member.requests.directive.html',
				controller: [
					'$scope',
					'$rootScope',
					'Authentication',
					function($scope, $rootScope, Authentication) {
						const vm = this;
						const isUser = Authentication.user;
						vm.isAdmin =
							isUser &&
							Authentication.user.roles.indexOf('admin') !== -1;
						vm.model = $scope.model;
						vm.title = $scope.title || 'Member Requests';
						const modelService = $scope.service;
						let queryObject: any = {};
						const reset = () => {
							queryObject = {};
							queryObject[$scope.idstring] = $scope.model._id;
							modelService
								.getRequests(queryObject)
								.$promise.then(result => {
									vm.members = result;
									const columnLength =
										Math.floor(result.length / 2) +
										(result.length % 2);
									vm.columns = [
										{
											start: 0,
											end: columnLength
										},
										{
											start: columnLength,
											end: result.length
										}
									];
								});
						};
						vm.confirm = userid => {
							queryObject.userId = userid;
							modelService
								.confirmMember(queryObject)
								.$promise.then(() => {
									$rootScope.$broadcast(
										'updateMembers',
										'done'
									);
								});
						};
						vm.deny = userid => {
							queryObject.userId = userid;
							modelService
								.denyMember(queryObject)
								.$promise.then(() => {
									$rootScope.$broadcast(
										'updateMembers',
										'done'
									);
								});
						};
						$rootScope.$on('updateMembers', () => {
							reset();
						});
						reset();
					}
				]
			};
		})

		.filter('slice', () => {
			return (arr, start, end) => {
				if (!arr || !arr.slice) {
					return;
				}
				return arr.slice(start, end);
			};
		})

		.filter('columnRanges', () => {
			const memo = [];
			return (items, count) => {
				if (count < 1) {
					count = 1;
				}
				const itemlen = items ? items.length : 0;
				const len =
					count === 1
						? itemlen
						: Math.floor(itemlen / count) + (itemlen % count);
				if (!memo[count]) {
					memo[count] = [];
				}
				if (!memo[count][len]) {
					const arr = [];
					let i = 0;
					let start = 0;
					if (itemlen) {
						for (; i < count; i++) {
							arr.push({
								start,
								end: Math.min(start + len, itemlen)
							});
							start += len;
						}
					}
					memo[count][len] = arr;
				}
				return memo[count][len];
			};
		});
})();
