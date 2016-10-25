(function () {
  'use strict';

  angular
    .module('opportunities.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.opportunities', {
        abstract: true,
        url: '/opportunities',
        template: '<ui-view/>'
      })
      .state('admin.opportunities.list', {
        url: '',
        templateUrl: '/modules/opportunities/client/views/admin/list-opportunities.client.view.html',
        controller: 'OpportunitiesAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        }
      })
      .state('admin.opportunities.create', {
        url: '/create',
        templateUrl: '/modules/opportunities/client/views/admin/form-opportunity.client.view.html',
        controller: 'OpportunitiesAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          opportunityResolve: newOpportunity
        }
      })
      .state('admin.opportunities.edit', {
        url: '/:opportunityId/edit',
        templateUrl: '/modules/opportunities/client/views/admin/form-opportunity.client.view.html',
        controller: 'OpportunitiesAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin']
        },
        resolve: {
          opportunityResolve: getOpportunity
        }
      });
  }

  getOpportunity.$inject = ['$stateParams', 'OpportunitiesService'];

  function getOpportunity($stateParams, OpportunitiesService) {
    return OpportunitiesService.get({
      opportunityId: $stateParams.opportunityId
    }).$promise;
  }

  newOpportunity.$inject = ['OpportunitiesService'];

  function newOpportunity(OpportunitiesService) {
    return new OpportunitiesService();
  }
}());
