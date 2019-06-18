'use strict';

import { Ng1StateDeclaration, StateParams, StateProvider } from '@uirouter/angularjs';
import angular from 'angular';
import { ICapabilitiesService, ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { IOpportunitiesService, IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import { IOrgResource, IOrgService } from '../../../orgs/client/services/OrgService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IProposalResource, IProposalService } from '../services/ProposalService';

class ProposalRouter {
	private rootState: Ng1StateDeclaration = {
		abstract: true,
		url: '/proposals',
		template: '<ui-view autoscroll="true"></ui-view>',
		resolve: {
			capabilities: ['CapabilitiesService', this.resolveCapabilities]
		}
	};

	private viewCWUState: Ng1StateDeclaration = {
		url: '/cwu/:proposalId',
		data: {
			roles: ['user']
		},
		templateUrl: '/modules/proposals/client/views/cwu-proposal-view.html',
		controller: 'ProposalViewCWUController',
		controllerAs: 'ppp',
		resolve: {
			proposal: ['$stateParams', 'ProposalService', this.resolveProposal]
		}
	};

	private viewSWUState: Ng1StateDeclaration = {
		url: '/swu/:proposalId',
		data: {
			roles: ['user']
		},
		templateUrl: '/modules/proposals/client/views/swu-proposal-view.html',
		controller: 'ProposalViewSWUController',
		controllerAs: 'ppp',
		resolve: {
			proposal: ['$stateParams', 'ProposalService', this.resolveProposal]
		}
	};

	private adminRootState: Ng1StateDeclaration = {
		abstract: true,
		url: '/proposaladmin',
		template: '<ui-view autoscroll="true"></ui-view>',
		data: {
			notroles: ['gov', 'guest']
		},
		resolve: {
			capabilities: ['CapabilitiesService', this.resolveCapabilities]
		}
	};

	private editCWUState: Ng1StateDeclaration = {
		url: '/:proposalId/editcwu/:opportunityId',
		data: {
			roles: ['user'],
			notroles: ['gov']
		},
		templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
		controller: 'ProposalEditCWUController',
		controllerAs: 'ppp',
		resolve: {
			proposal: ['$stateParams', 'ProposalService', this.resolveProposal],
			opportunity: ['$stateParams', 'OpportunitiesService', this.resolveOpportunity],
			editing() {
				return true;
			},
			org: ['AuthenticationService', 'OrgService', this.resolveOrg]
		}
	};

	private editSWUState: Ng1StateDeclaration = {
		url: '/:proposalId/editswu/:opportunityId',
		data: {
			roles: ['user'],
			notroles: ['gov']
		},
		templateUrl: '/modules/proposals/client/views/swu-proposal-edit.html',
		controller: 'ProposalEditSWUController',
		controllerAs: 'ppp',
		resolve: {
			proposal: ['$stateParams', 'ProposalService', this.resolveProposal],
			opportunity: ['$stateParams', 'OpportunitiesService', this.resolveOpportunity],
			editing() {
				return true;
			},
			org: ['AuthenticationService', 'OrgService', this.resolveOrg],
			resources: [
				'AuthenticationService',
				'ProposalService',
				'$stateParams',
				'OrgService',
				this.resolveResources
			]
		}
	};

	private createCWUState: Ng1StateDeclaration = {
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
				'ProposalService',
				(ProposalService: IProposalService) => {
					return new ProposalService();
				}
			],
			opportunity: ['$stateParams', 'OpportunitiesService', this.resolveOpportunity],
			org: ['AuthenticationService', 'OrgService', this.resolveOrg],
			editing() {
				return false;
			}
		}
	};

	private createSWUState: Ng1StateDeclaration = {
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
			opportunity: ['$stateParams', 'OpportunitiesService', this.resolveOpportunity],
			org: ['AuthenticationService', 'OrgService', this.resolveOrg],
			resources: [
				'AuthenticationService',
				'ProposalService',
				'$stateParams',
				'OrgService',
				this.resolveResources
			],
			editing() {
				return false;
			}
		}
	};

	constructor(private $stateProvider: StateProvider) {
		this.init();
	}

	private init(): void {
		this.$stateProvider.state('proposals', this.rootState);
		this.$stateProvider.state('proposals.viewcwu', this.viewCWUState);
		this.$stateProvider.state('proposals.viewswu', this.viewSWUState);

		this.$stateProvider.state('proposaladmin', this.adminRootState);
		this.$stateProvider.state('proposaladmin.editcwu', this.editCWUState);
		this.$stateProvider.state('proposaladmin.editswu', this.editSWUState);
		this.$stateProvider.state('proposaladmin.createcwu', this.createCWUState);
		this.$stateProvider.state('proposaladmin.createswu', this.createSWUState);
	}

	private async resolveProposal($stateParams: StateParams, ProposalService: IProposalService): Promise<IProposalResource> {
		return await ProposalService.get({
			proposalId: $stateParams.proposalId
		}).$promise;
	}

	private async resolveOpportunity($stateParams: StateParams, OpportunitiesService: IOpportunitiesService): Promise<IOpportunityResource> {
		return await OpportunitiesService.get({
			opportunityId: $stateParams.opportunityId
		}).$promise;
	}

	private async resolveCapabilities(CapabilitiesService: ICapabilitiesService): Promise<ICapabilityResource[]> {
		return await CapabilitiesService.query().$promise;
	}

	private async resolveOrg(AuthenticationService: IAuthenticationService, OrgService: IOrgService): Promise<IOrgResource> {
		if (!AuthenticationService.user) {
			return null;
		}
		const orgs = await OrgService.myadmin().$promise;
		if (orgs && orgs.length > 0) {
			return orgs[0];
		} else {
			return null;
		}
	}

	private async resolveResources(AuthenticationService: IAuthenticationService, ProposalService: IProposalService, $stateParams: StateParams, OrgService: IOrgService): Promise<any> {
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
}

angular.module('proposals.routes').config(['$stateProvider', ($stateProvider: StateProvider) => new ProposalRouter($stateProvider)]);
