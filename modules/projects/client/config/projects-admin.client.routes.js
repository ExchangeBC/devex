(function () {
  'use strict';

  angular
    .module('projects.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.projects', {
        abstract: true,
        url: '/projects',
        template: '<ui-view/>'
      })
      .state('admin.projects.list', {
        url: '',
        templateUrl: '/modules/projects/client/views/admin/list-projects.client.view.html',
        controller: 'ProjectsAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        }
      })
      .state('admin.projects.create', {
        url: '/create',
        templateUrl: '/modules/projects/client/views/admin/form-project.client.view.html',
        controller: 'ProjectsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          projectResolve: newProject
        }
      })
      .state('admin.projects.edit', {
        url: '/:projectId/edit',
        templateUrl: '/modules/projects/client/views/admin/form-project.client.view.html',
        controller: 'ProjectsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          projectResolve: getProject
        }
      });
  }

  getProject.$inject = ['$stateParams', 'ProjectsService'];

  function getProject($stateParams, ProjectsService) {
    return ProjectsService.get({
      projectId: $stateParams.projectId
    }).$promise;
  }

  newProject.$inject = ['ProjectsService'];

  function newProject(ProjectsService) {
    return new ProjectsService();
  }
}());
