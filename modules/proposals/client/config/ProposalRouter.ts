'use strict';

import angular, { ui } from 'angular';
import { IState, IStateParamsService, IStateProvider } from 'angular-ui-router';
import OpportunitiesService from '../../../opportunities/client/services/OpportunitiesService';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import ProposalService from '../services/ProposalService';

// All the client side routes for proposals
(() => {
	angular.module('proposals.routes').config([
		'$stateProvider',
		($stateProvider: IStateProvider) => {
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
							CapabilitiesService => {
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
							'proposalService',
							($stateParams: IStateParamsService, proposalService: ProposalService) => {
								return proposalService.getProposalResourceClass().get({
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
							'proposalService',
							($stateParams: IStateParamsService, proposalService: ProposalService) => {
								return proposalService.getProposalResourceClass().get({
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
							CapabilitiesService => {
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
							'proposalService',
							($stateParams: IStateParamsService, proposalService: ProposalService) => {
								return proposalService.getProposalResourceClass().get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						],
						opportunity: [
							'$stateParams',
							'opportunitiesService',
							($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService) => {
								return opportunitiesService.getOpportunityResourceClass().get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						editing() {
							return true;
						},
						org: [
							'authenticationService',
							'OrgsService',
							(authenticationService: AuthenticationService, OrgsService) => {
								if (!authenticationService.user) {
									return {};
								}
								return OrgsService.myadmin().$promise.then(orgs => {
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

				// create a new CWU proposal and edit it
				.state('proposaladmin.createcwu', {
					url: '/createcwu/:opportunityId',
					data: {
						roles: ['user'],
						notroles: ['gov']
					},
					templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
					controller: 'ProposalEditCWUController',
					controllerAs: 'ppp',
					resolve: {
						proposal: [
							'proposalService',
							(proposalService: ProposalService) => {
								const resourceClass = proposalService.getProposalResourceClass();
								return new resourceClass();
							}
						],
						opportunity: [
							'$stateParams',
							'opportunitiesService',
							($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService) => {
								return opportunitiesService.getOpportunityResourceClass().get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						org: [
							'authenticationService',
							'OrgsService',
							(authenticationService: AuthenticationService, OrgsService) => {
								if (!authenticationService.user) {
									return {};
								}
								return OrgsService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						],
						editing() {
							return false;
						}
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
							'proposalService',
							($stateParams: IStateParamsService, proposalService: ProposalService) => {
								return proposalService.getProposalResourceClass().get({
									proposalId: $stateParams.proposalId
								}).$promise;
							}
						],
						opportunity: [
							'$stateParams',
							'opportunitiesService',
							($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService) => {
								return opportunitiesService.getOpportunityResourceClass().get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						editing() {
							return true;
						},
						org: [
							'authenticationService',
							'OrgsService',
							(authenticationService: AuthenticationService, OrgsService) => {
								if (!authenticationService.user) {
									return null;
								}
								return OrgsService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						],
						resources: [
							'OrgsService',
							'authenticationService',
							'proposalService',
							'$stateParams',
							(OrgsService, authenticationService: AuthenticationService, proposalService: ProposalService, $stateParams: IStateParamsService) => {
								if (!authenticationService.user) {
									return null;
								} else {
									return OrgsService.myadmin().$promise.then(orgs => {
										if (orgs && orgs.length > 0) {
											const org = orgs[0];
											return proposalService.getProposalResourceClass().getPotentialResources({
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
							'proposalService',
							(proposalService: ProposalService) => {
								const resourceClass = proposalService.getProposalResourceClass();
								return new resourceClass();
							}
						],
						opportunity: [
							'$stateParams',
							'opportunitiesService',
							($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService) => {
								return opportunitiesService.getOpportunityResourceClass().get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						org: [
							'authenticationService',
							'OrgsService',
							(authenticationService: AuthenticationService, OrgsService) => {
								if (!authenticationService.user) {
									return null;
								}
								return OrgsService.myadmin().$promise.then(orgs => {
									if (orgs && orgs.length > 0) {
										return orgs[0];
									} else {
										return null;
									}
								});
							}
						],
						resources: [
							'authenticationService',
							'proposalService',
							'$stateParams',
							'OrgsService',
							(authenticationService: AuthenticationService, proposalService: ProposalService, $stateParams: IStateParamsService, OrgsService) => {
								if (!authenticationService.user) {
									return null;
								} else {
									return OrgsService.myadmin().$promise.then(orgs => {
										if (orgs && orgs.length > 0) {
											const org = orgs[0];
											return proposalService.getProposalResourceClass().getPotentialResources({
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
