(function () {
  'use strict';

  angular
    .module('programs.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.programs', {
        abstract: true,
        url: '/programs',
        template: '<ui-view/>'
      })
      .state('admin.programs.list', {
        url: '',
        templateUrl: '/modules/programs/client/views/admin/list-programs.client.view.html',
        controller: 'ProgramsAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        }
      })
      .state('admin.programs.create', {
        url: '/create',
        templateUrl: '/modules/programs/client/views/admin/form-program.client.view.html',
        controller: 'ProgramsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          programResolve: newProgram
        }
      })
      .state('admin.programs.edit', {
        url: '/:programId/edit',
        templateUrl: '/modules/programs/client/views/admin/form-program.client.view.html',
        controller: 'ProgramsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          programResolve: getProgram
        }
      });
  }

  getProgram.$inject = ['$stateParams', 'ProgramsService'];

  function getProgram($stateParams, ProgramsService) {
    return ProgramsService.get({
      programId: $stateParams.programId
    }).$promise;
  }

  newProgram.$inject = ['ProgramsService'];

  function newProgram(ProgramsService) {
    return new ProgramsService();
  }
}());
