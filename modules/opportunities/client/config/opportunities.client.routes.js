// =========================================================================
//
// All the client side routes for opportunities
//
// =========================================================================
(function () {
  'use strict';

  angular.module('opportunities.routes').config(['$stateProvider', function ($stateProvider) {
    $stateProvider
    // -------------------------------------------------------------------------
    //
    // this is the top level, abstract route for all opportunity routes, it only
    // contians the ui-view that all other routes get rendered in
    //
    // -------------------------------------------------------------------------
    .state('opportunities', {
      abstract: true,
      url: '/opportunities',
      template: '<ui-view/>'
    })
    // -------------------------------------------------------------------------
    //
    // opportunity listing. Resolve to all opportunities in the system and place that in
    // the scope. listing itself is done through a directive
    //
    // -------------------------------------------------------------------------
    .state('opportunities.list', {
      url: '',
      templateUrl: '/modules/opportunities/client/views/list-opportunities.client.view.html',
      data: {
        pageTitle: 'Opportunities List'
      },
      ncyBreadcrumb: {
        label: 'Opportunities'
      },
      resolve: {
        opportunities: function ($stateParams, OpportunitiesService) {
          return OpportunitiesService.query ();
        }
      },
      controller: 'OpportunitiesListController',
      controllerAs: 'vm'
    })
    // -------------------------------------------------------------------------
    //
    // view a opportunity, resolve the opportunity data
    //
    // -------------------------------------------------------------------------
    .state('opportunities.view', {
      url: '/:opportunityId',
      params: {
        programId: null
      },
      templateUrl: '/modules/opportunities/client/views/view-opportunity.client.view.html',
      controller: 'OpportunityViewController',
      controllerAs: 'vm',
      resolve: {
        opportunity: function ($stateParams, OpportunitiesService) {
          return OpportunitiesService.get({
            opportunityId: $stateParams.opportunityId
          }).$promise;
        }
      },
      data: {
        pageTitle: 'Opportunity {{ opportunityResolve.title }}'
      },
      ncyBreadcrumb: {
        label: '{{vm.opportunity.name}}',
        parent: 'opportunities.list'
      }
    })
    // -------------------------------------------------------------------------
    //
    // the base for editing
    //
    // -------------------------------------------------------------------------
    .state('opportunityadmin', {
      abstract: true,
      url: '/opportunityadmin',
      template: '<ui-view/>'
    })
    // -------------------------------------------------------------------------
    //
    // edit a opportunity
    //
    // -------------------------------------------------------------------------
    .state('opportunityadmin.edit', {
      url: '/:opportunityId/edit',
      params: {
        programId: null
      },
      templateUrl: '/modules/opportunities/client/views/edit-opportunity.client.view.html',
      controller: 'OpportunityEditController',
      controllerAs: 'vm',
      resolve: {
        opportunity: function ($stateParams, OpportunitiesService) {
          return OpportunitiesService.get({
            opportunityId: $stateParams.opportunityId
          }).$promise;
        },
        editing: function () { return true; }
      },
      data: {
        roles: ['admin', 'gov'],
        pageTitle: 'Opportunity {{ opportunity.title }}'
      },
      ncyBreadcrumb: {
        label: 'Edit Opportunity',
        parent: 'opportunities.list'
      }
    })
    // -------------------------------------------------------------------------
    //
    // create a new opportunity and edit it
    //
    // -------------------------------------------------------------------------
    .state('opportunityadmin.create', {
      url: '/create',
      params: {
        programId: null
      },
      templateUrl: '/modules/opportunities/client/views/edit-opportunity.client.view.html',
      controller: 'OpportunityEditController',
      controllerAs: 'vm',
      resolve: {
        opportunity: function (OpportunitiesService) {
          return new OpportunitiesService();
        },
        editing: function () { return false; }
      },
      data: {
        roles: ['admin', 'gov'],
        pageTitle: 'New Opportunity'
      },
      ncyBreadcrumb: {
        label: 'New Opportunity',
        parent: 'opportunities.list'
      }
    })
    ;
  }]);
}());


// (function () {
//   'use strict';

//   angular
//     .module('opportunities')
//     .config(routeConfig);

//   routeConfig.$inject = ['$stateProvider'];

//   function routeConfig($stateProvider) {
//     $stateProvider
//       .state('opportunities', {
//         abstract: true,
//         url: '/opportunities',
//         template: '<ui-view/>'
//       })
//       .state('opportunities.list', {
//         url: '',
//         templateUrl: 'modules/opportunities/client/views/list-opportunities.client.view.html',
//         controller: 'OpportunitiesListController',
//         controllerAs: 'vm',
//         data: {
//           pageTitle: 'Opportunities List'
//         }
//       })
//       .state('opportunities.create', {
//         url: '/create',
//         templateUrl: 'modules/opportunities/client/views/form-opportunity.client.view.html',
//         controller: 'OpportunitiesController',
//         controllerAs: 'vm',
//         resolve: {
//           opportunityResolve: newOpportunity
//         },
//         data: {
//           roles: ['user', 'admin'],
//           pageTitle: 'Create A Opportunity'
//         }
//       })
//       .state('opportunities.view', {
//         url: '/:opportunityId',
//         templateUrl: 'modules/opportunities/client/views/view-opportunity.client.view.html',
//         controller: 'OpportunitiesController',
//         controllerAs: 'vm',
//         resolve: {
//           opportunityResolve: getOpportunity
//         },
//         data: {
//           pageTitle: 'Opportunity {{ opportunityResolve.name }}'
//         }
//       })
//       .state('opportunities.edit', {
//       url: '/:opportunityId/edit',
//       templateUrl: 'modules/opportunities/client/views/form-opportunity.client.view.html',
//       controller: 'OpportunitiesController',
//       controllerAs: 'vm',
//       resolve: {
//         opportunityResolve: getOpportunity
//       },
//       data: {
//         roles: ['user', 'admin'],
//         pageTitle: 'Edit Opportunity {{ opportunityResolve.name }}'
//       }
//     });
//   }

//   getOpportunity.$inject = ['$stateParams', 'OpportunitiesService'];

//   function getOpportunity($stateParams, OpportunitiesService) {
// 	var resp = OpportunitiesService.get({
//       opportunityId: $stateParams.opportunityId
//     }).$promise;

// 	if (resp.isArray) {
// 		console.log(resp);
// 		// force an object back, otherwise, we're good.
// 		resp = toObject(resp);
// 	}

//     return resp;

// 	function toObject(arr) {
// 	  var rv = {};
// 	  for (var i = 0; i < arr.length; ++i)
// 		if (arr[i] !== undefined) rv[i] = arr[i];
// 	  return rv;
// 	}
//   }

//   newOpportunity.$inject = ['OpportunitiesService'];

//   function newOpportunity(OpportunitiesService) {
//     return new OpportunitiesService();
//   }
// }());
