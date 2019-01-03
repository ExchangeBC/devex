'use strict';

import angular, { IDirective, IScope } from 'angular';

(() => {
	angular
		.module('core')

		// directive for listing model member requests
		.directive(
			'coreMemberRequests',
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
					templateUrl: '/modules/core/client/views/member.requests.directive.html',
					controller: [
						'$scope',
						'$rootScope',
						'AuthenticationService',
						function($scope, $rootScope, authenticationService) {
							const vm = this;
							const isUser = authenticationService.user;
							vm.isAdmin = isUser && authenticationService.user.roles.indexOf('admin') !== -1;
							vm.model = $scope.model;
							vm.title = $scope.title || 'Member Requests';
							const modelService = $scope.service;
							let queryObject: any = {};

							const reset = async (): Promise<void> => {
								queryObject = {};
								queryObject[$scope.idstring] = $scope.model._id;
								const result = await modelService.getRequests(queryObject).$promise;
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

							vm.confirm = async (userid: string): Promise<void> => {
								queryObject.userId = userid;
								await modelService.confirmMember(queryObject).$promise;
								$rootScope.$broadcast('updateMembers', 'done');
							};

							vm.deny = async (userid: string): Promise<void> => {
								queryObject.userId = userid;
								await modelService.denyMember(queryObject).$promise;
								$rootScope.$broadcast('updateMembers', 'done');
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
