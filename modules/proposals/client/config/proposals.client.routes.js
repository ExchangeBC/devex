// =========================================================================
//
// All the client side routes for proposals
//
// =========================================================================
(function () {
	'use strict';

	angular.module('proposals.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all proposal routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state ('proposals', {
			abstract: true,
			url: '/proposals',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// proposal listing. Resolve to all proposals in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state ('proposals.list', {
			url: '',
			templateUrl: '/modules/proposals/client/views/list-proposals.client.view.html',
			data: {
				pageTitle: 'Proposals List'
			},
			ncyBreadcrumb: {
				label: 'All proposals'
			},
			resolve: {
				proposals: function ($stateParams, ProposalsService) {
					return ProposalsService.query ();
				}
			},
			controller: 'ProposalsListController',
			controllerAs: 'vm',
			roles: ['admin', 'gov']
		})
		// -------------------------------------------------------------------------
		//
		// view a proposal, resolve the proposal data
		//
		// -------------------------------------------------------------------------
		.state ('proposals.view', {
			url: '/:proposalId',
			data: {
				roles: ['user']
			},
			onEnter: function ($uibModal, $state, $stateParams, ProposalsService) {
				$uibModal.open ({
					size: 'lg',
					templateUrl: '/modules/proposals/client/views/view-proposal.client.view.html',
					controller: 'ProposalViewController',
					resolve: {
						proposal: function ($stateParams, ProposalsService) {
							return {};
							// return ProposalsService.get ({
							// 	proposalId: $stateParams.proposalId
							// }).$promise;
						}
					}
				}).result.finally (function () {
					$state.go ($state.previous.state, $state.previous.params);
				});
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin', {
			abstract: true,
			url: '/proposaladmin',
			template: '<ui-view/>',
			data: {
				notroles: ['gov', 'guest']
			}
		})
		// -------------------------------------------------------------------------
		//
		// edit a proposal
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.edit', {
			url: '/:proposalId/edit/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			onEnter: function ($uibModal, $state, $stateParams, ProposalsService) {
				//
				// CC: there is a weird bug here where $stateparams is available correctly here
				// but NOT insidethe resolves. ??????
				//
				var proid = $stateParams.proposalId;
				var oppid = $stateParams.opportunityId;
				// console.log ('go get proposal:', proid);
				// console.log ('go get opp:', oppid);
				$uibModal.open ({
					size: 'lg',
					templateUrl: '/modules/proposals/client/views/edit-proposal.client.view.html',
					controller: 'ProposalEditController',
					controllerAs: 'ppp',
					bindToController: true,
					resolve: {
						proposal: function ($stateParams, ProposalsService) {
							return ProposalsService.get ({
								proposalId: proid
							}).$promise;
						},
						opportunity: function ($stateParams, OpportunitiesService) {
							return OpportunitiesService.get({
								opportunityId: oppid
							}).$promise;
						},
						editing: true
					}
				}).result.finally (function () {
					$state.go ($state.previous.state, $state.previous.params);
				});
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new proposal and edit it
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.create', {
			url: '/create/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			onEnter: function ($uibModal, $state, $stateParams, ProposalsService) {
				var oppid = $stateParams.opportunityId;
				$uibModal.open ({
					size: 'lg',
					templateUrl: '/modules/proposals/client/views/edit-proposal.client.view.html',
					controller: 'ProposalEditController',
					controllerAs: 'ppp',
					bindToController: true,
					resolve: {
						proposal: function ($stateParams, ProposalsService) {
							return new ProposalsService ();
						},
						opportunity: function ($stateParams, OpportunitiesService) {
							return OpportunitiesService.get({
								opportunityId: oppid
							}).$promise;
						},
						editing: false
					}
				}).result.finally (function () {
					$state.go ($state.previous.state, $state.previous.params);
				});
			}
		})
		;
	}]);
}());


