(function () {
  'use strict';

  angular
    .module('projects')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('projects', {
        abstract: true,
        url: '/projects',
        template: '<ui-view/>'
      })
      .state('projects.list', {
        url: '',
        templateUrl: 'modules/projects/client/views/list-projects.client.view.html',
        controller: 'ProjectsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Projects List'
        }
      })
      .state('projects.create', {
        url: '/create',
        templateUrl: 'modules/projects/client/views/form-project.client.view.html',
        controller: 'ProjectsController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: newProject
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Create A Project'
        }
      })
      .state('projects.edit', {
        url: '/:projectId/edit',
        templateUrl: 'modules/projects/client/views/form-project.client.view.html',
        controller: 'ProjectsController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: getProject
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Project {{ projectResolve.name }}'
        }
      })
      .state('projects.view', {
        url: '/:projectId',
        templateUrl: 'modules/projects/client/views/view-project.client.view.html',
        controller: 'ProjectsController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: getProject
        },
        data: {
          pageTitle: 'Project {{ projectResolve.name }}'
        }
      });
  }

  getProject.$inject = ['$stateParams', 'ProjectsService'];

  function getProject($stateParams, ProjectsService) {
	var resp = ProjectsService.get({
      projectId: $stateParams.projectId
    }).$promise;

	if (resp.isArray) {
		console.log(resp);
		// force an object back, otherwise, we're good.
		resp = toObject(resp);
	}

    return resp;

	function toObject(arr) {
	  var rv = {};
	  for (var i = 0; i < arr.length; ++i)
		if (arr[i] !== undefined) rv[i] = arr[i];
	  return rv;
	}
  }

  newProject.$inject = ['ProjectsService'];

  function newProject(ProjectsService) {
    return new ProjectsService();
  }
}());
