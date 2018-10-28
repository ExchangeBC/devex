// =========================================================================
//
// All the client side routes for opportunities
//
// =========================================================================
(function() {
	'use strict';

	angular.module('opportunities.routes').config([
		'$stateProvider',
		function($stateProvider) {
			$stateProvider
				// -------------------------------------------------------------------------
				//
				// this is the top level, abstract route for all opportunity routes, it only
				// contians the ui-view that all other routes get rendered in
				//
				// -------------------------------------------------------------------------
				.state('opportunities', {
					abstract: true,
					url: '/opportunities',
					template: '<ui-view autoscroll="true"></ui-view>',
					resolve: {
						capabilities: [
							'CapabilitiesService',
							function(CapabilitiesService) {
								return CapabilitiesService.query().$promise;
							}
						],
						opportunities: [
							'$stateParams',
							'OpportunitiesService',
							function($stateParams, OpportunitiesService) {
								return OpportunitiesService.query();
							}
						]
					}
				})
				// -------------------------------------------------------------------------
				//
				// opportunity listing. Resolve to all opportunities in the system and place that in
				// the scope. listing itself is done through a directive
				//
				// -------------------------------------------------------------------------
				.state('opportunities.list', {
					url: '',
					templateUrl: '/modules/opportunities/client/views/opportunity-list.html',
					data: {
						pageTitle: 'Opportunities List'
					},
					ncyBreadcrumb: {
						label: 'All opportunities'
					},
					controller: 'OpportunitiesListController',
					controllerAs: 'vm'
				})
				// -------------------------------------------------------------------------
				//
				// view a opportunity, resolve the opportunity data
				//
				// -------------------------------------------------------------------------
				.state('opportunities.viewcwu', {
					url: '/cwu/:opportunityId',
					templateUrl: '/modules/opportunities/client/views/cwu-opportunity-view.html',
					controller: 'OpportunityViewController',
					controllerAs: 'vm',
					resolve: {
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							function($stateParams, OpportunitiesService) {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						myproposal: [
							'$stateParams',
							'ProposalsService',
							'Authentication',
							function($stateParams, ProposalsService, Authentication) {
								if (!Authentication.user) return {};
								return ProposalsService.myopp({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						]
					},
					data: {
						pageTitle: 'Opportunity: {{opportunity.name}}'
					},
					ncyBreadcrumb: {
						label: '{{vm.opportunity.name}}',
						parent: 'opportunities.list'
					}
				})
				// -------------------------------------------------------------------------
				//
				// view a opportunity, resolve the opportunity data
				//
				// -------------------------------------------------------------------------
				.state('opportunities.viewswu', {
					url: '/swu/:opportunityId',
					templateUrl: '/modules/opportunities/client/views/swu-opportunity-view.html',
					controller: 'OpportunityViewSWUController',
					controllerAs: 'vm',
					resolve: {
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							function($stateParams, OpportunitiesService) {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						],
						org: [
							'Authentication',
							'OrgsService',
							function(Authentication, OrgsService) {
								if (!Authentication.user) return {};
								return OrgsService.myadmin().$promise.then(function(orgs) {
									if (orgs && orgs.length > 0) return orgs[0];
									else return {};
								});
							}
						],
						myproposal: [
							'$stateParams',
							'ProposalsService',
							'Authentication',
							'org',
							function($stateParams, ProposalsService, Authentication, org) {
								if (!Authentication.user) return {};
								if (!org || !org._id) return {};
								return ProposalsService.myOrgOpp({
									orgId: org._id,
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						]
					},
					data: {
						pageTitle: 'Opportunity: {{opportunity.name}}'
					},
					ncyBreadcrumb: {
						label: '{{vm.opportunity.name}}',
						parent: 'opportunities.list'
					}
				})
				// -------------------------------------------------------------------------
				//
				// the base for editing
				//
				// -------------------------------------------------------------------------
				.state('opportunityadmin', {
					abstract: true,
					url: '/opportunityadmin/:opportunityId',
					template: '<ui-view autoscroll="true"></ui-view>',
					resolve: {
						capabilities: [
							'CapabilitiesService',
							function(CapabilitiesService) {
								return CapabilitiesService.query().$promise;
							}
						],
						programs: [
							'ProgramsService',
							function(ProgramsService) {
								return ProgramsService.myadmin().$promise;
							}
						],
						projects: [
							'ProjectsService',
							function(ProjectsService) {
								return ProjectsService.myadmin().$promise;
							}
						],
						editing: function() {
							return true;
						},
						opportunity: [
							'$stateParams',
							'OpportunitiesService',
							function($stateParams, OpportunitiesService) {
								return OpportunitiesService.get({
									opportunityId: $stateParams.opportunityId
								}).$promise;
							}
						]
					}
				})
				// -------------------------------------------------------------------------
				//
				// edit a opportunity
				//
				// -------------------------------------------------------------------------
				.state('opportunityadmin.editcwu', {
					url: '/editcwu',
					templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
					controller: 'OpportunityEditController',
					controllerAs: 'vm',
					data: {
						roles: ['admin', 'gov'],
						pageTitle: 'Opportunity: {{ opportunity.name }}'
					},
					ncyBreadcrumb: {
						label: 'Edit Opportunity',
						parent: 'opportunities.list'
					}
				})
				// -------------------------------------------------------------------------
				//
				// edit a opportunity
				//
				// -------------------------------------------------------------------------
				.state('opportunityadmin.editswu', {
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
				})
				// -------------------------------------------------------------------------
				//
				// create a new opportunity and edit it
				//
				// -------------------------------------------------------------------------
				.state('oppcreatelanding', {
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
				})
				// -------------------------------------------------------------------------
				//
				// create a new opportunity and edit it
				//
				// -------------------------------------------------------------------------
				.state('createcwu', {
					url: '/createcwu',
					templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
					controller: 'OpportunityEditController',
					controllerAs: 'vm',
					resolve: {
						opportunity: [
							'OpportunitiesService',
							function(OpportunitiesService) {
								return new OpportunitiesService();
							}
						],
						programs: [
							'ProgramsService',
							function(ProgramsService) {
								return ProgramsService.myadmin().$promise;
							}
						],
						projects: [
							'ProjectsService',
							function(ProjectsService) {
								return ProjectsService.myadmin().$promise;
							}
						],
						editing: function() {
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
				})
				// -------------------------------------------------------------------------
				//
				// create a new opportunity and edit it
				//
				// -------------------------------------------------------------------------
				.state('createswu', {
					url: '/createswu',
					templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
					controller: 'OpportunityEditSWUController',
					controllerAs: 'vm',
					resolve: {
						capabilities: [
							'CapabilitiesService',
							function(CapabilitiesService) {
								return CapabilitiesService.query().$promise;
							}
						],
						opportunity: [
							'OpportunitiesService',
							function(OpportunitiesService) {
								return new OpportunitiesService();
							}
						],
						programs: [
							'ProgramsService',
							function(ProgramsService) {
								return ProgramsService.myadmin().$promise;
							}
						],
						projects: [
							'ProjectsService',
							function(ProjectsService) {
								return ProjectsService.myadmin().$promise;
							}
						],
						editing: function() {
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
				})
				// -------------------------------------------------------------------------
				//
				// create a new opportunity and edit it
				//
				// -------------------------------------------------------------------------
				.state('opportunityadmin.approvalrequestswu', {
					url: '/requestapprovalswu',
					templateUrl: '/modules/opportunities/client/views/opportunity-approval/swu-opportunity-approval-request.html',
					controller: 'OpportunityApprovalController',
					controllerAs: 'vm',
					data: {
						roles: ['admin', 'gov'],
						pageTitle: 'New SWU Approval Request'
					}
				});
		}
	]);
}());
