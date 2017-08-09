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
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// opportunity listing. Resolve to all opportunities in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('opportunities.list', {
			url: '',
			templateUrl: '/modules/opportunities/client/views/list-opportunities.client.view.html',
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
		.state('opportunities.view', {
			url: '/:opportunityId',
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/view-opportunity.client.view.html',
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
				// ,
				// proposal: function ($stateParams, ProposalsService, Authentication) {
				// 	if (!Authentication.user) return [];
				// 	console.log ('get proposal');
				// 	return ProposalsService.forOpportunity ({
				// 		opportunityId: $stateParams.opportunityId
				// 	}).$promise;
				// }
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
			url: '/opportunityadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a opportunity
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin.edit', {
			url: '/:opportunityId/edit',
			params: {
				programId: null,
				projectId: null
			},
			templateUrl: '/modules/opportunities/client/views/edit-opportunity.client.view.html',
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
				editing: function () { return true; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				}
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
		// create a new opportunity and edit it
		//
		// -------------------------------------------------------------------------
		.state('opportunityadmin.create', {
			url: '/create',
			params: {
				programId: null,
				programTitle: null,
				projectId: null,
				projectTitle: null,
				context: null
			},
			templateUrl: '/modules/opportunities/client/views/edit-opportunity.client.view.html',
			controller: 'OpportunityEditController',
			controllerAs: 'vm',
			resolve: {
				opportunity: function (OpportunitiesService) {
					return new OpportunitiesService();
				},
				projects: function (ProjectsService) {
					return ProjectsService.myadmin ().$promise;
				},
				editing: function () { return false; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
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
		;
	}]);
}());

