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
// (function () {
//   'use strict';

//   angular
//     .module('programs')
//     .config(routeConfig);

//   routeConfig.$inject = ['$stateProvider'];

//   function routeConfig($stateProvider) {
//     $stateProvider
//       .state('programs', {
//         abstract: true,
//         url: '/programs',
//         template: '<ui-view/>'
//       })
//       .state('programs.list', {
//         url: '',
//         templateUrl: 'modules/programs/client/views/list-programs.client.view.html',
//         controller: 'ProgramsListController',
//         controllerAs: 'vm',
//         data: {
//           pageTitle: 'Programs List'
//         }
//       })
//       .state('programs.create', {
//         url: '/create',
//         templateUrl: 'modules/programs/client/views/form-program.client.view.html',
//         controller: 'ProgramsController',
//         controllerAs: 'vm',
//         resolve: {
//           programResolve: newProgram
//         },
//         data: {
//           roles: ['user', 'admin'],
//           pageTitle: 'Create A Program'
//         }
//       })
//       .state('programs.edit', {
//         url: '/:programId/edit',
//         templateUrl: 'modules/programs/client/views/form-program.client.view.html',
//         controller: 'ProgramsController',
//         controllerAs: 'vm',
//         resolve: {
//           programResolve: getProgram
//         },
//         data: {
//           roles: ['user', 'admin'],
//           pageTitle: 'Edit Program {{ programResolve.name }}'
//         }
//       })
//       .state('programs.view', {
//         url: '/:programId',
//         templateUrl: 'modules/programs/client/views/view-program.client.view.html',
//         controller: 'ProgramsController',
//         controllerAs: 'vm',
//         resolve: {
//           programResolve: getProgram
//         },
//         data: {
//           pageTitle: 'Program {{ programResolve.name }}'
//         }
//       });
//   }

//   getProgram.$inject = ['$stateParams', 'ProgramsService'];

//   function getProgram($stateParams, ProgramsService) {
//     return ProgramsService.get({
//       programId: $stateParams.programId
//     }).$promise;
//   }

//   newProgram.$inject = ['ProgramsService'];

//   function newProgram(ProgramsService) {
//     return new ProgramsService();
//   }
// }());
