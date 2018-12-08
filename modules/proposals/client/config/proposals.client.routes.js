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
			template: '<ui-view autoscroll="true"></ui-view>',
			resolve: {
				capabilities: ['CapabilitiesService', function (CapabilitiesService) {
					return CapabilitiesService.query ().$promise;
				}]
			}
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
				proposals: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return ProposalsService.query ().$promise;
				}]
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
		.state ('proposals.viewcwu', {
			url: '/cwu/:proposalId',
			data: {
				roles: ['user']
			},
			templateUrl: '/modules/proposals/client/views/cwu-proposal-view.html',
			controller: 'ProposalCWUViewController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return ProposalsService.get ({
						proposalId: $stateParams.proposalId
					}).$promise;
				}]
			}
		})
		// -------------------------------------------------------------------------
		//
		// view a proposal, resolve the proposal data
		//
		// -------------------------------------------------------------------------
		.state ('proposals.viewswu', {
			url: '/swu/:proposalId',
			data: {
				roles: ['user']
			},
			templateUrl: '/modules/proposals/client/views/swu-proposal-view.html',
			controller: 'ProposalSWUViewController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return ProposalsService.get ({
						proposalId: $stateParams.proposalId
					}).$promise;
				}]
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
			template: '<ui-view autoscroll="true"></ui-view>',
			data: {
				notroles: ['gov', 'guest']
			},
			resolve: {
				capabilities: ['CapabilitiesService', function (CapabilitiesService) {
					return CapabilitiesService.query ().$promise;
				}]
			}
		})
		// -------------------------------------------------------------------------
		//
		// edit a proposal
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.editcwu', {
			url: '/:proposalId/editcwu/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
			controller: 'ProposalCWUEditController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return ProposalsService.get ({
						proposalId: $stateParams.proposalId
					}).$promise;
				}],
				opportunity: ['$stateParams', 'OpportunitiesService', function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}],
				editing: function () { return true; },
				org: ['Authentication', 'OrgsService', function (Authentication, OrgsService) {
					if (!Authentication.user) return {};
					return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) return orgs[0];
						else return null;
					});
				}]
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new proposal and edit it
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.createcwu', {
			url: '/createcwu/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
			controller: 'ProposalCWUEditController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return new ProposalsService ();
				}],
				opportunity: ['$stateParams', 'OpportunitiesService', function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}],
				org: ['Authentication', 'OrgsService', function (Authentication, OrgsService) {
					if (!Authentication.user) return {};
					return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) return orgs[0];
						else return null;
					});
					// var orgs = Authentication.user.orgsAdmin || [null];
					// var org = orgs[0];
					// if (org) return OrgsService.get ({orgId:org}).$promise;
					// else return null;
				}],
				editing: function () { return false; }
			}
		})
		// -------------------------------------------------------------------------
		//
		// edit a proposal
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.editswu', {
			url: '/:proposalId/editswu/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			templateUrl: '/modules/proposals/client/views/swu-proposal-edit.html',
			controller: 'ProposalSWUEditController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['$stateParams', 'ProposalsService', function ($stateParams, ProposalsService) {
					return ProposalsService.get ({
						proposalId: $stateParams.proposalId
					}).$promise;
				}],
				opportunity: ['$stateParams', 'OpportunitiesService', function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}],
				editing: function () { return true; },
				org: ['Authentication', 'OrgsService', function (Authentication, OrgsService) {
					if (!Authentication.user) return null;
					return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) return orgs[0];
						else return null;
					});
				}],
				resources: ['OrgsService', 'Authentication', 'ProposalsService', '$stateParams', function (OrgsService, Authentication, ProposalsService, $stateParams) {
					if (!Authentication.user) return null;
					else return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) {
							var org = orgs[0];
							return ProposalsService.getPotentialResources ({
								opportunityId : $stateParams.opportunityId,
								orgId         : org._id
							}).$promise;
						}
						else return null;
					});
				}]
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new proposal and edit it
		//
		// -------------------------------------------------------------------------
		.state ('proposaladmin.createswu', {
			url: '/createswu/:opportunityId',
			data: {
				roles: ['user'],
				notroles: ['gov']
			},
			templateUrl: '/modules/proposals/client/views/swu-proposal-edit.html',
			controller: 'ProposalSWUEditController',
			controllerAs: 'ppp',
			bindToController: true,
			resolve: {
				proposal: ['ProposalsService', function (ProposalsService) {
					return new ProposalsService ();
				}],
				opportunity: ['$stateParams', 'OpportunitiesService', function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}],
				org: ['Authentication', 'OrgsService', function (Authentication, OrgsService) {
					if (!Authentication.user) return null;
					return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) return orgs[0];
						else return null;
					});
				}],
				resources: ['Authentication', 'ProposalsService', '$stateParams', 'OrgsService', function (Authentication, ProposalsService, $stateParams, OrgsService) {
					if (!Authentication.user) return null;
					else return OrgsService.myadmin ().$promise.then (function (orgs) {
						if (orgs && orgs.length > 0) {
							var org = orgs[0];
							return ProposalsService.getPotentialResources ({
								opportunityId : $stateParams.opportunityId,
								orgId         : org._id
							}).$promise;
						}
						else return null;
					});
				}],
				editing: function () { return false; }
			}
		})
		;
	}]);
}());


