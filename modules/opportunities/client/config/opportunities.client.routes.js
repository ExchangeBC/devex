// =========================================================================
//
// All the client side routes for opportunities
//
// =========================================================================
(function () {
	'use strict';

	angular.module('opportunities.routes').config(['$stateProvider', function ($stateProvider) {
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
			template: '<ui-view/>',
			resolve: {
				capabilities: function (CapabilitiesService) {
					return CapabilitiesService.query ();
				}
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
			resolve: {
				opportunities: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.query ();
				},
				subscriptions: function (NotificationsService) {
					return NotificationsService.subscriptions().$promise;
				}
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
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-view.html',
			controller: 'OpportunityViewController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get ({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				},
				subscriptions: function (NotificationsService) {
					return NotificationsService.subscriptions().$promise;
				},
				myproposal: function ($stateParams, ProposalsService, Authentication) {
					if (!Authentication.user) return {};
					return ProposalsService.myopp ({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}
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
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-view.html',
			controller: 'OpportunityViewSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get ({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				},
				subscriptions: function (NotificationsService) {
					return NotificationsService.subscriptions().$promise;
				},
				myproposal: function ($stateParams, ProposalsService, Authentication) {
					if (!Authentication.user) return {};
					return ProposalsService.myopp ({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Opportunity: {{opportunity.name}}'
			},
			ncyBreadcrumb: {
				label: '{{vm.opportunity.name}}',
				parent: 'opportunities.list'
			}
		})
		// // -------------------------------------------------------------------------
		// //
		// // view a opportunity, resolve the opportunity data
		// //
		// // -------------------------------------------------------------------------
		// .state('opportunities.view', {
		// 	url: '/any/:opportunityId',
		// 	params: {
		// 		programId: null,
		// 		projectId: null
		// 	},
		// 	templateUrl: '/modules/opportunities/client/views/view-opportunity.client.view.html',
		// 	controller: 'OpportunityViewController',
		// 	controllerAs: 'vm',
		// 	resolve: {
		// 		opportunity: function ($stateParams, OpportunitiesService) {
		// 			return OpportunitiesService.get ({
		// 				opportunityId: $stateParams.opportunityId
		// 			}).$promise;
		// 		},
		// 		subscriptions: function (NotificationsService) {
		// 			return NotificationsService.subscriptions().$promise;
		// 		},
		// 		myproposal: function ($stateParams, ProposalsService, Authentication) {
		// 			if (!Authentication.user) return {};
		// 			return ProposalsService.myopp ({
		// 				opportunityId: $stateParams.opportunityId
		// 			}).$promise;
		// 		}
		// 	},
		// 	data: {
		// 		pageTitle: 'Opportunity: {{opportunity.name}}'
		// 	},
		// 	ncyBreadcrumb: {
		// 		label: '{{vm.opportunity.name}}',
		// 		parent: 'opportunities.list'
		// 	}
		// })
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin', {
			abstract: true,
			url: '/opportunityadmin',
			template: '<ui-view/>',
			resolve: {
				capabilities: function (CapabilitiesService) {
					return CapabilitiesService.query ();
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// edit a opportunity
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin.editcwu', {
			url: '/:opportunityId/editcwu',
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				},
				programs: function (ProgramsService) {
					return ProgramsService.myadmin ().$promise;
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return true; }
			},
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
			url: '/:opportunityId/editswu',
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				},
				programs: function (ProgramsService) {
					return ProgramsService.myadmin ().$promise;
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return true; }
			},
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
		// Submit this opportunity for approval
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin.submit', {
			url: '/:opportunityId/submit',
			templateUrl: '/modules/opportunities/client/views/opportunity-approval-form.html',
			controller: 'OpportunityApprovalController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function ($stateParams, OpportunitiesService) {
					return OpportunitiesService.get({
						opportunityId: $stateParams.opportunityId
					}).$promise;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: '{{ opportunity.name }} Approval'
			},
			ncyBreadcrumb: {
				label: 'Opportunity',
				parent: 'opportunities.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new opportunity and edit it
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin.createlanding', {
			url: '/createlanding',
			params: {
				programId    : null,
				programTitle : null,
				projectId    : null,
				projectTitle : null,
				context      : null
			},
			templateUrl: '/modules/opportunities/client/views/opportunity-create.html',
			controller: 'OpportunityLandingController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function (OpportunitiesService) {
					return new OpportunitiesService();
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return false; }
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
		.state('opportunityadmin.createcwu', {
			url: '/createcwu',
			params: {
				programId: null,
				programTitle: null,
				projectId: null,
				projectTitle: null,
				context: null
			},
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function (OpportunitiesService) {
					return new OpportunitiesService();
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return false; }
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
		.state('opportunityadmin.createswu', {
			url: '/createswu',
			params: {
				programId: null,
				programTitle: null,
				projectId: null,
				projectTitle: null,
				context: null
			},
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function (OpportunitiesService) {
					return new OpportunitiesService();
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return false; }
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
		;
	}]);
}());

