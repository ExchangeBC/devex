'use strict';

import { StateParams, StateProvider } from '@uirouter/angularjs';
import angular from 'angular';
import { ICapabilitiesService } from '../../../capabilities/client/services/CapabilitiesService';
import { IOpportunitiesService } from '../../../opportunities/client/services/OpportunitiesService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IProposalService } from '../services/ProposalService';

// All the client side routes for proposals
(() => {
	angular.module('proposals.routes').config([
		'$stateProvider',
		($stateProvider: StateProvider) => {
			$stateProvider

				// this is the top level, abstract route for all proposal routes, it only
				// contians the ui-view that all other routes get rendered in
				.state('proposals', {
					abstract: true,
					url: '/proposals',
					template: '<ui-view autoscroll="true"></ui-view>',
					resolve: {
						capabilities: [
							'CapabilitiesService',
							(CapabilitiesService: ICapabilitiesService) => {
								return CapabilitiesService.query().$promise;
							}
						]
					}
				})

				// view a CWU proposal, resolve the proposal data
				.state('proposals.viewcwu', {
					url: '/cwu/:proposalId',
					data: {
						roles: ['user']
					},
					templateUrl: '/modules/proposals/client/views/cwu-proposal-view.html',
					controller: 'ProposalViewCWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'$stateParams',
							'ProposalService',
							($stateParams: StateParams, proposalService: IProposalService) => {
								return proposalService.get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						]
					}
				})

				// view a SWU proposal, resolve the proposal data
				.state('proposals.viewswu', {
					url: '/swu/:proposalId',
					data: {
						roles: ['user']
					},
					templateUrl: '/modules/proposals/client/views/swu-proposal-view.html',
					controller: 'ProposalViewSWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'$stateParams',
							'ProposalService',
							($stateParams: StateParams, ProposalService: IProposalService) => {
								return ProposalService.get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						]
					}
				})

				// the base for editing
				.state('proposaladmin', {
					abstract: true,
					url: '/proposaladmin',
					template: '<ui-view autoscroll="true"></ui-view>',
					data: {
						notroles: ['gov', 'guest']
					},
					resolve: {
						capabilities: [
							'CapabilitiesService',
							(CapabilitiesService: ICapabilitiesService) => {
								return CapabilitiesService.query().$promise;
							}
						]
					}
				})

				// edit a CWU proposal
				.state('proposaladmin.editcwu', {
					url: '/:proposalId/editcwu/:opportunityId',
					data: {
						roles: ['user'],
						notroles: ['gov']
					},
					templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
					controller: 'ProposalEditCWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'$stateParams',
							'ProposalService',
							($stateParams: StateParams, ProposalService: IProposalService) => {
								return ProposalService.get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						],
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							($stateParams: StateParams, OpportunitiesService: IOpportunitiesService) => {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						editing() {
							return true;
						},
						org: [
							'AuthenticationService',
							'OrgService',
							(AuthenticationService: IAuthenticationService, OrgService) => {
								if (!AuthenticationService.user) {
									return {};
								}
								return OrgService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						]
					}
				})

				// edit a SWU proposal
				.state('proposaladmin.editswu', {
					url: '/:proposalId/editswu/:opportunityId',
					data: {
						roles: ['user'],
						notroles: ['gov']
					},
					templateUrl: '/modules/proposals/client/views/swu-proposal-edit.html',
					controller: 'ProposalEditSWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'$stateParams',
							'ProposalService',
							($stateParams: StateParams, ProposalService: IProposalService) => {
								return ProposalService.get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						],
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							($stateParams: StateParams, OpportunitiesService: IOpportunitiesService) => {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						editing() {
							return true;
						},
						org: [
							'AuthenticationService',
							'OrgService',
							(AuthenticationService: IAuthenticationService, OrgService) => {
								if (!AuthenticationService.user) {
									return null;
								}
								return OrgService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						],
						resources: [
							'OrgService',
							'AuthenticationService',
							'ProposalService',
							'$stateParams',
							(OrgService, AuthenticationService: IAuthenticationService, ProposalService: IProposalService, $stateParams: StateParams) => {
								if (!AuthenticationService.user) {
									return null;
								} else {
									return OrgService.myadmin().$promise.then(orgs => {
										if (orgs && orgs.length > 0) {
											const org = orgs[0];
											return ProposalService.getPotentialResources({
												opportunityId: $stateParams.opportunityId,
												orgId: org._id
											}).$promise;
										} else {
											return null;
										}
									});
								}
							}
						]
					}
				})

				// create a new SWU proposal and edit it
				.state('proposaladmin.createswu', {
					url: '/createswu/:opportunityId',
					data: {
						roles: ['user'],
						notroles: ['gov']
					},
					templateUrl: '/modules/proposals/client/views/swu-proposal-edit.html',
					controller: 'ProposalEditSWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'ProposalService',
							(ProposalService: IProposalService) => {
								return new ProposalService();
							}
						],
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							($stateParams: StateParams, OpportunitiesService: IOpportunitiesService) => {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						org: [
							'AuthenticationService',
							'OrgService',
							(AuthenticationService: IAuthenticationService, OrgService) => {
								if (!AuthenticationService.user) {
									return null;
								}
								return OrgService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						],
						resources: [
							'AuthenticationService',
							'ProposalService',
							'$stateParams',
							'OrgService',
							(AuthenticationService: IAuthenticationService, ProposalService: IProposalService, $stateParams: StateParams, OrgService) => {
								if (!AuthenticationService.user) {
									return null;
								} else {
									return OrgService.myadmin().$promise.then(orgs => {
										if (orgs && orgs.length > 0) {
											const org = orgs[0];
											return ProposalService.getPotentialResources({
												opportunityId: $stateParams.opportunityId,
												orgId: org._id
											}).$promise;
										} else {
											return null;
										}
									});
								}
							}
						],
						editing() {
							return false;
						}
					}
				});
		}
	]);
})();
