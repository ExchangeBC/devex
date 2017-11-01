// =========================================================================
//
// All the client side routes for teams
//
// =========================================================================
(function () {
	'use strict';

	if (window.features.swu) angular.module('teams.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all team routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('teams', {
			abstract: true,
			url: '/teams',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// team listing. Resolve to all teams in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('teams.list', {
			url: '',
			templateUrl: '/modules/teams/client/views/list-teams.client.view.html',
			data: {
				pageTitle: 'Teams List'
			},
			ncyBreadcrumb: {
				label: 'All teams'
			},
			resolve: {
				teams: function ($stateParams, TeamsService) {
					return TeamsService.query ();
				}
			},
			controller: 'TeamsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a team, resolve the team data
		//
		// -------------------------------------------------------------------------
		.state('teams.view', {
			url: '/:teamId',
			params: {
				programId: null
			},
			templateUrl: '/modules/teams/client/views/view-team.client.view.html',
			controller: 'TeamViewController',
			controllerAs: 'vm',
			resolve: {
				team: function ($stateParams, TeamsService) {
					return TeamsService.get({
						teamId: $stateParams.teamId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Team: {{ team.name }}'
			},
			ncyBreadcrumb: {
				label: '{{vm.team.name}}',
				parent: 'teams.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('teamadmin', {
			abstract: true,
			url: '/teamadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a team
		//
		// -------------------------------------------------------------------------
		.state('teamadmin.edit', {
			url: '/:teamId/edit',
			params: {
				context: null
			},
			templateUrl: '/modules/teams/client/views/edit-team.client.view.html',
			controller: 'TeamEditController',
			controllerAs: 'vm',
			resolve: {
				team: function ($stateParams, TeamsService) {
					return TeamsService.get({
						teamId: $stateParams.teamId
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
				pageTitle: 'Team {{ team.title }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Team',
				parent: 'teams.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new team and edit it
		//
		// -------------------------------------------------------------------------
		.state('teamadmin.create', {
			url: '/create',
			params: {
				programId: null,
				programTitle: null,
				context: null
			},
			templateUrl: '/modules/teams/client/views/edit-team.client.view.html',
			controller: 'TeamEditController',
			controllerAs: 'vm',
			resolve: {
				team: function (TeamsService) {
					return new TeamsService();
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
				pageTitle: 'New Team'
			},
			ncyBreadcrumb: {
				label: 'New Team',
				parent: 'teams.list'
			}
		})
		;
	}]);
}());


