(function () {
  'use strict';

  angular
    .module('opportunities.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('opportunities', {
        abstract: true,
        url: '/opportunities',
        template: '<ui-view/>'
      })
      .state('opportunities.list', {
        url: '',
        templateUrl: '/modules/opportunities/client/views/list-opportunities.client.view.html',
        controller: 'OpportunitiesListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Opportunities List'
        }
      })
      .state('opportunities.view', {
        url: '/:opportunityId',
        templateUrl: '/modules/opportunities/client/views/view-opportunity.client.view.html',
        controller: 'OpportunitiesController',
        controllerAs: 'vm',
        resolve: {
          opportunityResolve: getOpportunity
        },
        data: {
          pageTitle: 'Opportunity {{ opportunityResolve.title }}'
        }
      });
  }

  getOpportunity.$inject = ['$stateParams', 'OpportunitiesService'];

  function getOpportunity($stateParams, OpportunitiesService) {
    return OpportunitiesService.get({
      opportunityId: $stateParams.opportunityId
    }).$promise;
  }
}());
