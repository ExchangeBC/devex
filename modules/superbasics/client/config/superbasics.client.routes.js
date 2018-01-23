// =========================================================================
//
// All the client side routes for superbasics
//
// =========================================================================
(function () {
	'use strict';

	if (window.features.swu) angular.module('superbasics.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all superbasic routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('superbasics', {
			abstract: true,
			url: '/superbasics',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// superbasic listing. Resolve to all superbasics in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('superbasics.list', {
			url: '',
			templateUrl: '/modules/superbasics/client/views/list-superbasics.client.view.html',
			data: {
				pageTitle: 'Superbasics List'
			},
			ncyBreadcrumb: {
				label: 'All superbasics'
			},
			resolve: {
				superbasics: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.query ();
				}
			},
			controller: 'SuperbasicsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a superbasic, resolve the superbasic data
		//
		// -------------------------------------------------------------------------
		.state('superbasics.view', {
			url: '/:superbasicId',
			params: {
				programId: null
			},
			templateUrl: '/modules/superbasics/client/views/view-superbasic.client.view.html',
			controller: 'SuperbasicViewController',
			controllerAs: 'vm',
			resolve: {
				superbasic: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.get({
						superbasicId: $stateParams.superbasicId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Superbasic: {{ superbasic.name }}'
			},
			ncyBreadcrumb: {
				label: '{{vm.superbasic.name}}',
				parent: 'superbasics.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('superbasicadmin', {
			abstract: true,
			url: '/superbasicadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a superbasic
		//
		// -------------------------------------------------------------------------
		.state('superbasicadmin.edit', {
			url: '/:superbasicId/edit',
			params: {
				context: null
			},
			templateUrl: '/modules/superbasics/client/views/edit-superbasic.client.view.html',
			controller: 'SuperbasicEditController',
			controllerAs: 'vm',
			resolve: {
				superbasic: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.get({
						superbasicId: $stateParams.superbasicId
					}).$promise;
				},
				programs: function (ProgramsService) {
					return ProgramsService.myadmin ().$promise;
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
				pageTitle: 'Superbasic {{ superbasic.title }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Superbasic',
				parent: 'superbasics.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new superbasic and edit it
		//
		// -------------------------------------------------------------------------
		.state('superbasicadmin.create', {
			url: '/create',
			params: {
				programId: null,
				programTitle: null,
				context: null
			},
			templateUrl: '/modules/superbasics/client/views/edit-superbasic.client.view.html',
			controller: 'SuperbasicEditController',
			controllerAs: 'vm',
			resolve: {
				superbasic: function (SuperbasicsService) {
					return new SuperbasicsService();
				},
				programs: function (ProgramsService) {
					return ProgramsService.myadmin ().$promise;
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
				pageTitle: 'New Superbasic'
			},
			ncyBreadcrumb: {
				label: 'New Superbasic',
				parent: 'superbasics.list'
			}
		})
		;
	}]);
}());


