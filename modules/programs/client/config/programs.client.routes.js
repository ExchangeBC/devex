// =========================================================================
//
// All the client side routes for programs
//
// =========================================================================
(function () {
	'use strict';

	angular.module('programs.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all program routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('programs', {
			abstract: true,
			url: '/programs',
			template: '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// program listing. Resolve to all programs in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('programs.list', {
			url: '',
			templateUrl: '/modules/programs/client/views/list-programs.client.view.html',
			data: {
				pageTitle: 'Programs List'
			},
			ncyBreadcrumb: {
				label: 'All programs'
			},
			resolve: {
				programs: function ($stateParams, ProgramsService) {
					return ProgramsService.query ();
				}
			},
			controller: 'ProgramsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a program, resolve the program data
		//
		// -------------------------------------------------------------------------
		.state('programs.view', {
			url: '/:programId',
			templateUrl: '/modules/programs/client/views/view-program.client.view.html',
			controller: 'ProgramViewController',
			controllerAs: 'vm',
			resolve: {
				program: function ($stateParams, ProgramsService) {
					return ProgramsService.get({
						programId: $stateParams.programId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Program: {{program.title}}'
			},
			ncyBreadcrumb: {
				label: '{{vm.program.title}}',
				parent: 'programs.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('programadmin', {
			abstract: true,
			url: '/programadmin',
			template: '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a program
		//
		// -------------------------------------------------------------------------
		.state('programadmin.edit', {
			url: '/:programId/edit',
			templateUrl: '/modules/programs/client/views/edit-program.client.view.html',
			controller: 'ProgramEditController',
			controllerAs: 'vm',
			resolve: {
				program: function ($stateParams, ProgramsService) {
					return ProgramsService.get({
						programId: $stateParams.programId
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
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Program: {{ program.title }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Program',
				parent: 'programs.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new program and edit it
		//
		// -------------------------------------------------------------------------
		.state('programadmin.create', {
			url: '/create',
			templateUrl: '/modules/programs/client/views/edit-program.client.view.html',
			controller: 'ProgramEditController',
			controllerAs: 'vm',
			resolve: {
				program: function (ProgramsService) {
					return new ProgramsService();
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
				pageTitle: 'New Program'
			},
			ncyBreadcrumb: {
				label: 'New Program',
				parent: 'programs.list'
			}
		})
		;
	}]);
}());
