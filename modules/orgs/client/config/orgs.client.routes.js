// =========================================================================
//
// All the client side routes for orgs
//
// =========================================================================
(function() {
	'use strict';

	angular.module('orgs.routes').config([
		'$stateProvider',
		function($stateProvider) {
			$stateProvider
				// -------------------------------------------------------------------------
				//
				// this is the top level, abstract route for all org routes, it only
				// contians the ui-view that all other routes get rendered in
				//
				// -------------------------------------------------------------------------
				.state('orgs', {
					abstract: true,
					url: '/orgs',
					template: '<ui-view autoscroll="true"></ui-view>'
				})
				// -------------------------------------------------------------------------
				//
				// create a new org
				//
				// -------------------------------------------------------------------------
				.state('orgs.create', {
					url: '/create',
					templateUrl: '/modules/orgs/client/views/org-add.html',
					controller: 'OrgCreateController',
					controllerAs: 'vm',
					resolve: {
						org: [
							'OrgService',
							function(OrgService) {
								return new OrgService();
							}
						]
					}
				})
				// -------------------------------------------------------------------------
				//
				// org listing. Resolve to all orgs in the system and place that in
				// the scope. listing itself is done through a directive
				//
				// -------------------------------------------------------------------------
				.state('orgs.list', {
					url: '',
					templateUrl: '/modules/orgs/client/views/list-orgs.client.view.html',
					data: {
						pageTitle: 'Orgs List'
					},
					ncyBreadcrumb: {
						label: 'All orgs'
					},
					resolve: {
						orgs: [
							'OrgService',
							function(OrgService) {
								return OrgService.query().$promise;
							}
						]
					},
					controller: 'OrgsListController',
					controllerAs: 'vm'
				})
				// -------------------------------------------------------------------------
				//
				// view an org, resolve the org data
				//
				// -------------------------------------------------------------------------
				.state('orgs.view', {
					url: '/:orgId',
					templateUrl: '/modules/orgs/client/views/org-view.html',
					controller: 'OrgViewController',
					controllerAs: 'vm',
					resolve: {
						org: [
							'$stateParams',
							'OrgService',
							function($stateParams, OrgService) {
								return OrgService.get({
									orgId: $stateParams.orgId
								}).$promise;
							}
						],
						capabilities: [
							'CapabilitiesService',
							function(CapabilitiesService) {
								return CapabilitiesService.query().$promise;
							}
						]
					}
				})
				// -------------------------------------------------------------------------
				//
				// the base for editing
				//
				// -------------------------------------------------------------------------
				.state('orgadmin', {
					url: '/orgadmin/:orgId',
					templateUrl: '/modules/orgs/client/views/org-edit.html',
					controller: 'OrgAdminController',
					controllerAs: 'vm',
					resolve: {
						org: [
							'$stateParams',
							'OrgService',
							function($stateParams, OrgService) {
								return OrgService.get({
									orgId: $stateParams.orgId
								}).$promise;
							}
						],
						capabilities: [
							'CapabilitiesService',
							function(CapabilitiesService) {
								return CapabilitiesService.query().$promise;
							}
						]
					},
					data: {
						roles: ['user', 'admin']
					}
				})
		}
	]);
}());
