'use strict';

import angular, { resource } from 'angular';
import { IState, IStateParamsService, IStateProvider } from 'angular-ui-router';
import CapabilitiesService, { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IProgram } from '../../../programs/shared/IProgramDTO';
import { IProject } from '../../../projects/shared/IProjectDTO';
import ProposalService, { IProposalResource } from '../../../proposals/client/services/ProposalService';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import OpportunitiesService, { IOpportunityResource } from '../services/OpportunitiesService';

export default class OpportunityRouter {
	public static $inject = ['$stateProvider'];

	constructor(private $stateProvider: IStateProvider) {
		this.init();
	}

	private init(): void {
		this.$stateProvider.state('opportunities', this.rootState());
		this.$stateProvider.state('opportunities.list', this.listState());
		this.$stateProvider.state('opportunities.viewcwu', this.viewCWUState());
		this.$stateProvider.state('opportunities.viewswu', this.viewSWUState());

		this.$stateProvider.state('opportunityadmin', this.adminRootState());
		this.$stateProvider.state('opportunityadmin.editcwu', this.editCWUState());
		this.$stateProvider.state('opportunityadmin.editswu', this.editSWUState());
		this.$stateProvider.state('createcwu', this.createCWUState());
		this.$stateProvider.state('createswu', this.createSWUState());
		this.$stateProvider.state('oppcreatelanding', this.createLandingState());
	}

	private rootState(): IState {
		return {
			abstract: true,
			url: '/opportunities',
			template: '<ui-view autoscroll="true"></ui-view>',
			resolve: {
				capabilities: [
					'capabilitiesService',
					(capabilitiesService: CapabilitiesService) => {
						return capabilitiesService.getCapabilitiesResourceClass().query().$promise;
					}
				]
			}
		};
	}

	private listState(): IState {
		return {
			url: '',
			templateUrl: '/modules/opportunities/client/views/opportunity-list.html',
			data: {
				pageTitle: 'Opportunities List'
			},
			ncyBreadcrumb: {
				label: 'All opportunities'
			}
		};
	}

	private viewCWUState(): IState {
		return {
			url: '/cwu/:opportunityId',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-view.html',
			controller: 'OpportunityViewCWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'$stateParams',
					'opportunitiesService',
					async ($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService): Promise<IOpportunityResource> => {
						return await opportunitiesService.getOpportunityResourceClass().get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				],
				myproposal: [
					'$stateParams',
					'proposalService',
					'authenticationService',
					async ($stateParams: IStateParamsService, proposalService: ProposalService, authenticationService: AuthenticationService): Promise<IProposalResource> => {
						if (!authenticationService.user) {
							return null;
						}

						return await proposalService.getProposalResourceClass().getMyProposal({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			},
			data: {
				pageTitle: 'Opportunity: {{opportunity.name}}'
			},
			ncyBreadcrumb: {
				label: '{{ vm.opportunity.name }}',
				parent: 'opportunities.list'
			}
		};
	}

	private viewSWUState(): IState {
		return {
			url: '/swu/:opportunityId',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-view.html',
			controller: 'OpportunityViewSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'$stateParams',
					'opportunitiesService',
					async ($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService): Promise<IOpportunityResource> => {
						return await opportunitiesService.getOpportunityResourceClass().get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				],
				org: [
					'authenticationService',
					'OrgService',
					async (authenticationService: AuthenticationService, OrgService): Promise<IOrg> => {
						if (!authenticationService.user) {
							return null;
						}

						const orgs = await OrgService.myadmin().$promise;
						if (orgs && orgs.length > 0) {
							return orgs[0];
						} else {
							return null;
						}
					}
				],
				myproposal: [
					'$stateParams',
					'proposalService',
					'authenticationService',
					'org',
					async ($stateParams: IStateParamsService, proposalService: ProposalService, authenticationService: AuthenticationService, org: IOrg): Promise<IProposalResource> => {
						if (!authenticationService.user) {
							return null;
						}

						if (!org || !org._id) {
							return null;
						}

						return await proposalService.getProposalResourceClass().getMyProposal({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			},
			data: {
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: '{{ vm.opportunity.name }}',
				parent: 'opportunities.list'
			}
		};
	}

	private adminRootState(): IState {
		return {
			abstract: true,
			url: '/opportunityadmin/:opportunityId',
			template: '<ui-view autoscroll="true"></ui-view>',
			resolve: {
				capabilities: [
					'capabilitiesService',
					async (capabilitiesService: CapabilitiesService): Promise<resource.IResourceArray<ICapabilityResource>> => {
						return await capabilitiesService.getCapabilitiesResourceClass().query().$promise;
					}
				],
				programs: [
					'ProgramsService',
					async (ProgramsService: any): Promise<IProgram[]> => {
						return await ProgramsService.myadmin().$promise;
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return true;
				},
				opportunity: [
					'$stateParams',
					'opportunitiesService',
					async ($stateParams: IStateParamsService, opportunitiesService: OpportunitiesService): Promise<IOpportunityResource> => {
						return await opportunitiesService.getOpportunityResourceClass().get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			}
		};
	}

	private editCWUState(): IState {
		return {
			url: '/editcwu',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditCWUController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private editSWUState(): IState {
		return {
			url: '/editswu',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createCWUState(): IState {
		return {
			url: '/createcwu',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditCWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'opportunitiesService',
					(opportunitiesService: OpportunitiesService): IOpportunityResource => {
						const resourceClass = opportunitiesService.getOpportunityResourceClass();
						return new resourceClass();
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject[]> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return false;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createSWUState(): IState {
		return {
			url: '/createswu',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'opportunitiesService',
					(opportunitiesService: OpportunitiesService): IOpportunityResource => {
						const resourceClass = opportunitiesService.getOpportunityResourceClass();
						return new resourceClass();
					}
				],
				capabilities: [
					'capabilitiesService',
					async (capabilitiesService: CapabilitiesService): Promise<resource.IResourceArray<ICapabilityResource>> => {
						return await capabilitiesService.getCapabilitiesResourceClass().query().$promise;
					}
				],
				programs: [
					'ProgramsService',
					async (ProgramsService: any): Promise<IProgram> => {
						return await ProgramsService.myadmin().$promise;
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return false;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createLandingState(): IState {
		return {
			url: '/createlanding',
			templateUrl: '/modules/opportunities/client/views/opportunity-create.html',
			controller: 'OpportunityLandingController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}
}

angular.module('opportunities.routes').config(['$stateProvider', ($stateProvider: IStateProvider) => new OpportunityRouter($stateProvider)]);
