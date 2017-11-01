// =========================================================================
//
// All the client side routes for orgs
//
// =========================================================================
(function () {
	'use strict';

	if (window.features.swu) angular.module('orgs.routes').config(['$stateProvider', function ($stateProvider) {
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
			template: '<ui-view/>'
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
				orgs: function ($stateParams, OrgsService) {
					return OrgsService.query ();
				}
			},
			controller: 'OrgsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a org, resolve the org data
		//
		// -------------------------------------------------------------------------
		.state('orgs.view', {
			url: '/:orgId',
			templateUrl: '/modules/orgs/client/views/view-org.client.view.html',
			controller: 'OrgViewController',
			controllerAs: 'vm',
			resolve: {
				org: function ($stateParams, OrgsService) {
					return OrgsService.get({
						orgId: $stateParams.orgId
					}).$promise;
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('orgadmin', {
			abstract: true,
			url: '/orgadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a org
		//
		// -------------------------------------------------------------------------
		.state('orgadmin.edit', {
			url: '/:orgId/edit',
			templateUrl: '/modules/orgs/client/views/edit-org.client.view.html',
			controller: 'OrgEditController',
			controllerAs: 'vm',
			resolve: {
				org: function ($stateParams, OrgsService) {
					return OrgsService.get({
						orgId: $stateParams.orgId
					}).$promise;
				},
				editing: function () { return true; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new org and edit it
		//
		// -------------------------------------------------------------------------
		.state('orgadmin.create', {
			url: '/create',
			templateUrl: '/modules/orgs/client/views/edit-org.client.view.html',
			controller: 'OrgEditController',
			controllerAs: 'vm',
			resolve: {
				org: function (OrgsService) {
					return new OrgsService();
				},
				editing: function () { return false; },
				previousState: function ($state) {
				  return {
					name: $state.current.name,
					params: $state.params,
					url: $state.href($state.current.name, $state.params)
				  };
				}
			}
		})
		;
	}]);
}());
