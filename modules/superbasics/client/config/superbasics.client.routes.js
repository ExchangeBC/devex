// =========================================================================
//
// All the client side routes for superbasics
//
// =========================================================================
(function () {
	'use strict';

	angular.module ('superbasics.routes').config (['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all superbasic routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state ('superbasics', {
			abstract : true,
			url      : '/superbasics',
			template : '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// superbasic listing. Resolve to all superbasics in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state ('superbasics.list', {
			url          : '',
			templateUrl  : '/modules/superbasics/client/views/list-superbasics.client.view.html',
			controller   : 'SuperbasicsListController',
			controllerAs : 'vm',
			resolve: {
				superbasics: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.query ();
				}
			},
			data: {
				pageTitle: 'Superbasics List'
			}
		})
		// -------------------------------------------------------------------------
		//
		// view a superbasic, resolve the superbasic data
		//
		// -------------------------------------------------------------------------
		.state ('superbasics.view', {
			url          : '/:superbasicId',
			templateUrl  : '/modules/superbasics/client/views/view-superbasic.client.view.html',
			controller   : 'SuperbasicViewController',
			controllerAs : 'vm',
			resolve: {
				superbasic: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.get ({
						superbasicId: $stateParams.superbasicId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Superbasic: {{ superbasic.name }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state ('superbasicadmin', {
			abstract : true,
			url      : '/superbasicadmin',
			template : '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a superbasic
		//
		// -------------------------------------------------------------------------
		.state ('superbasicadmin.edit', {
			url          : '/:superbasicId/edit',
			templateUrl  : '/modules/superbasics/client/views/edit-superbasic.client.view.html',
			controller   : 'SuperbasicEditController',
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return true; },
				superbasic: function ($stateParams, SuperbasicsService) {
					return SuperbasicsService.get ({
						superbasicId: $stateParams.superbasicId
					}).$promise;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Superbasic {{ superbasic.title }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new superbasic and edit it
		//
		// -------------------------------------------------------------------------
		.state ('superbasicadmin.create', {
			url          : '/create',
			templateUrl  : '/modules/superbasics/client/views/edit-superbasic.client.view.html',
			controller   : 'SuperbasicEditController',
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return false; },
				superbasic: function (SuperbasicsService) {
					return new SuperbasicsService ();
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Superbasic'
			}
		})
		;
	}]);
}());


