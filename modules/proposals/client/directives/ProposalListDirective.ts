'use strict';

import angular from 'angular';
import { IOpportunitiesService } from '../../../opportunities/client/services/OpportunitiesService';
import { IProposalService } from '../services/ProposalService';

(() => {
	angular
		.module('proposals')

		// directive for listing proposals
		.directive('proposalList', () => {
			return {
				restrict: 'E',
				controllerAs: 'vm',
				scope: {
					opportunity: '=',
					isclosed: '=',
					title: '@',
					context: '@'
				},
				templateUrl: '/modules/proposals/client/views/list.proposals.directive.html',
				controller: [
					'$scope',
					'ProposalService',
					'OpportunitiesService',
					'AuthenticationService',
					'Notification',
					function($scope, ProposalService: IProposalService, OpportunitiesService: IOpportunitiesService, authenticationService, Notification) {
						const vm = this;
						vm.opportunity = $scope.opportunity;
						vm.context = $scope.context;
						vm.proposals = [];
						vm.stats = {};
						vm.isclosed = $scope.isclosed;
						const isUser = authenticationService.user;
						vm.isAdmin = isUser && authenticationService.user.roles.indexOf('admin') !== -1;
						vm.isGov = isUser && authenticationService.user.roles.indexOf('gov') !== -1;
						if (vm.context === 'opportunity') {
							vm.opportunityId = vm.opportunity._id;
							vm.programTitle = vm.opportunity.title;
						} else {
							vm.opportunityId = null;
							vm.programTitle = null;
						}

						// if a opportunity is supplied, then only list proposals under it
						// also allow adding a new proposal (because it has context)
						if ($scope.opportunity) {
							vm.title = 'Proposals for ' + $scope.opportunity.title;
							vm.opportunityId = $scope.opportunity._id;
							vm.userCanAdd = $scope.opportunity.userIs.admin || vm.isAdmin;
							vm.proposals = ProposalService.getProposalsForOpp({
								opportunityId: $scope.opportunity._id
							});
							vm.columnCount = 1;
						} else {
							vm.title = 'All Proposals';
							vm.opportunityId = null;
							vm.userCanAdd = vm.isAdmin || vm.isGov;
							vm.proposals = ProposalService.query();
							vm.columnCount = 1;
						}
						if ($scope.opportunity) {
							vm.stats = OpportunitiesService.getProposalStats({
								opportunityId: $scope.opportunity._id
							});
						}
						if ($scope.title) {
							vm.title = $scope.title;
						}
						vm.publish = (proposal, state) => {
							const publishedState = proposal.isPublished;
							const t = state ? 'Published' : 'Un-Published';
							proposal.isPublished = state;
							proposal
								.createOrUpdate()

								// success, notify and return to list
								.then(() => {
									Notification.success({
										message: '<i class="fas fa-check-circle"></i> Proposal ' + t + ' Successfully!'
									});
								})

								// fail, notify and stay put
								.catch(res => {
									proposal.isPublished = publishedState;
									Notification.error({
										message: res.data.message,
										title: "<i class='fas fa-exclamation-triangle'></i> Proposal " + t + ' Error!'
									});
								});
						};
						vm.request = proposal => {
							ProposalService.makeRequest({
								proposalId: proposal._id
							})
								.$promise.then(() => {
									proposal.userIs.request = true;
									Notification.success({
										message: '<i class="fas fa-check-circle"></i> Membership request sent successfully!'
									});
								})
								.catch(res => {
									Notification.error({
										message: res.data.message,
										title: "<i class='fas fa-exclamation-triangle'></i> Membership Request Error!"
									});
								});
						};
					}
				]
			};
		});
})();
