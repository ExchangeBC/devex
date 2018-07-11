// =========================================================================
//
// All the client side routes for projects
//
// =========================================================================
(function () {
	'use strict';

	angular.module('projects.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all project routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('projects', {
			abstract: true,
			url: '/projects',
			template: '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// project listing. Resolve to all projects in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('projects.list', {
			url: '',
			templateUrl: '/modules/projects/client/views/list-projects.client.view.html',
			data: {
				pageTitle: 'Projects List'
			},
			ncyBreadcrumb: {
				label: 'All projects'
			},
			resolve: {
				projects: function ($stateParams, ProjectsService) {
					return ProjectsService.query ();
				}
			},
			controller: 'ProjectsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a project, resolve the project data
		//
		// -------------------------------------------------------------------------
		.state('projects.view', {
			url: '/:projectId',
			params: {
				programId: null
			},
			templateUrl: '/modules/projects/client/views/view-project.client.view.html',
			controller: 'ProjectViewController',
			controllerAs: 'vm',
			resolve: {
				project: function ($stateParams, ProjectsService) {
					return ProjectsService.get({
						projectId: $stateParams.projectId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Project: {{ project.name }}'
			},
			ncyBreadcrumb: {
				label: '{{vm.project.name}}',
				parent: 'projects.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('projectadmin', {
			abstract: true,
			url: '/projectadmin',
			template: '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a project
		//
		// -------------------------------------------------------------------------
		.state('projectadmin.edit', {
			url: '/:projectId/edit',
			params: {
				context: null
			},
			templateUrl: '/modules/projects/client/views/edit-project.client.view.html',
			controller: 'ProjectEditController',
			controllerAs: 'vm',
			resolve: {
				project: function ($stateParams, ProjectsService) {
					return ProjectsService.get({
						projectId: $stateParams.projectId
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
				pageTitle: 'Project {{ project.title }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Project',
				parent: 'projects.list'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new project and edit it
		//
		// -------------------------------------------------------------------------
		.state('projectadmin.create', {
			url: '/create',
			params: {
				programId: null,
				programTitle: null,
				context: null
			},
			templateUrl: '/modules/projects/client/views/edit-project.client.view.html',
			controller: 'ProjectEditController',
			controllerAs: 'vm',
			resolve: {
				project: function (ProjectsService) {
					return new ProjectsService();
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
				pageTitle: 'New Project'
			},
			ncyBreadcrumb: {
				label: 'New Project',
				parent: 'projects.list'
			}
		})
		;
	}]);
}());


