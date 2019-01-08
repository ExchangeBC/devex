'use strict';

import angular, { IDirective, IScope } from 'angular';

(() => {
	angular
		.module('core')

		// directive for listing model members
		.directive(
			'coreMemberList',
			(): IDirective<IScope> => {
				return {
					restrict: 'E',
					controllerAs: 'vm',
					scope: {
						model: '=',
						service: '=',
						idstring: '=',
						title: '@'
					},
					templateUrl: '/modules/core/client/views/members.directive.html',
					controller: [
						'$scope',
						'$rootScope',
						'AuthenticationService',
						function($scope, $rootScope, authenticationService) {
							const vm = this;
							const isUser = authenticationService.user;
							vm.isUser = isUser;
							vm.userid = isUser ? authenticationService.user.username : 'Guest';
							vm.isAdmin = isUser && authenticationService.user.roles.indexOf('admin') !== -1;
							vm.model = $scope.model;
							vm.title = $scope.title || 'Members';
							const modelService = $scope.service;
							let queryObject: any = {};

							const reset = async (): Promise<void> => {
								queryObject = {};
								queryObject[$scope.idstring] = $scope.model._id;
								const result = await modelService.getMembers(queryObject).$promise;
								vm.members = result;
								const columnLength = Math.floor(result.length / 2) + (result.length % 2);
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
							};

							vm.delete = async (userid: string, username: string, type: string): Promise<void> => {
								const adminMessage = 'Are you sure you want to remove ' + username + ' (this member)?';
								const userMessage = 'Are you sure you want to remove yourself from this membership list?';
								const message = type === 'admin' ? adminMessage : userMessage;
								if (confirm(message)) {
									queryObject.userId = userid;
									await modelService.denyMember(queryObject).$promise;
									$rootScope.$broadcast('updateMembers', 'done');
								}
							};
							$rootScope.$on('updateMembers', () => {
								reset();
							});
							reset();
						}
					]
				};
			}
		);
})();
