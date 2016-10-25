(function () {
  'use strict';

  angular
    .module('teams.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.teams', {
        abstract: true,
        url: '/teams',
        template: '<ui-view/>'
      })
      .state('admin.teams.list', {
        url: '',
        templateUrl: '/modules/teams/client/views/admin/list-teams.client.view.html',
        controller: 'TeamsAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        }
      })
      .state('admin.teams.create', {
        url: '/create',
        templateUrl: '/modules/teams/client/views/admin/form-team.client.view.html',
        controller: 'TeamsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          teamResolve: newTeam
        }
      })
      .state('admin.teams.edit', {
        url: '/:teamId/edit',
        templateUrl: '/modules/teams/client/views/admin/form-team.client.view.html',
        controller: 'TeamsAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          teamResolve: getTeam
        }
      });
  }

  getTeam.$inject = ['$stateParams', 'TeamsService'];

  function getTeam($stateParams, TeamsService) {
    return TeamsService.get({
      teamId: $stateParams.teamId
    }).$promise;
  }

  newTeam.$inject = ['TeamsService'];

  function newTeam(TeamsService) {
    return new TeamsService();
  }
}());
