(function () {
  'use strict';

  angular
    .module('programs.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('programs', {
        abstract: true,
        url: '/programs',
        template: '<ui-view/>'
      })
      .state('programs.list', {
        url: '',
        templateUrl: '/modules/programs/client/views/list-programs.client.view.html',
        data: {
          pageTitle: 'Programs List'
        }
      })
      .state('programs.view', {
        url: '/:programId',
        templateUrl: '/modules/programs/client/views/view-program.client.view.html',
        controller: 'ProgramsController',
        controllerAs: 'vm',
        resolve: {
          program: getProgram
        },
        data: {
          pageTitle: 'Program {{ programResolve.title }}'
        }
      });
  }

  getProgram.$inject = ['$stateParams', 'ProgramsService'];

  function getProgram($stateParams, ProgramsService) {
    return ProgramsService.get({
      programId: $stateParams.programId
    }).$promise;
  }
}());
