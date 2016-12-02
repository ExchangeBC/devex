(function () {
  'use strict';

  angular
    .module('opportunities.services')
    .factory('OpportunitiesService', OpportunitiesService);

  OpportunitiesService.$inject = ['$resource', '$log'];

  function OpportunitiesService($resource, $log) {
    var Opportunity = $resource('/api/opportunities/:opportunityId', {
      opportunityId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/opportunity/:opportunityId'
      },
      getRequests: {
        method: 'GET',
        url :'/api/opportunities/requests/:opportunityId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/opportunities/members/:opportunityId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/opportunities/requests/confirm/:opportunityId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/opportunities/requests/deny/:opportunityId/:userId'
      }
    });

    angular.extend(Opportunity.prototype, {
      createOrUpdate: function () {
        var opportunity = this;
        return createOrUpdate(opportunity);
      }
    });

    return Opportunity;

    function createOrUpdate(opportunity) {
      console.log ('create or update');
      if (opportunity._id) {
        return opportunity.$update(onSuccess, onError);
      } else {
        return opportunity.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(opportunity) {
        // Any required internal processing from inside the service, goes here.
      }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
      }
    }

    function handleError(error) {
      // Log error
      $log.error(error);
    }
  }
}());
