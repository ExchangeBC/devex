// Opportunities service used to communicate Opportunities REST endpoints
(function () {
  'use strict';

  angular
    .module('opportunities')
    .factory('OpportunitiesService', OpportunitiesService);

  OpportunitiesService.$inject = ['$resource', '$log'];

  function OpportunitiesService($resource, $log) {
    var Opportunity = $resource('/api/opportunities/:opportunityId', {
      opportunityId: '@_id'
    }, {
      update: {
        method: 'PUT',
        transformResponse: function (data) {
          data            = angular.fromJson(data);
          data.deadline   = new Date(data.deadline);
          data.assignment = new Date(data.assignment);
          data.start      = new Date(data.start);
          return data;
        }
      },
      save: {
        method: 'POST',
        transformResponse: function (data) {
          data            = angular.fromJson(data);
          data.deadline   = new Date(data.deadline);
          data.assignment = new Date(data.assignment);
          data.start      = new Date(data.start);
          return data;
        }
      },
      forProject: {
        method: 'GET',
        url: '/api/opportunities/for/project/:projectId',
        isArray: true
      },
      forProgram: {
        method: 'GET',
        url: '/api/opportunities/for/program/:programId',
        isArray: true
      },
      my: {
        method: 'GET',
        url: '/api/my/opportunities',
        isArray: true
      },
      publish: {
        method: 'GET',
        url :'/api/opportunities/publish/:opportunityId'
      },
      unpublish: {
        method: 'DELETE',
        url :'/api/opportunities/publish/:opportunityId'
      },
      unassign: {
        method: 'PUT',
        url: '/api/opportunities/unassign/:opportunityId',
        params: {opportunityId:'@opportunityId'}
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
      if (opportunity._id) {
        return opportunity.$update(onSuccess, onError);
      } else {
        return opportunity.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess() {
        // Any required internal processing from inside the service, goes here.
      }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
      }

      function handleError(error) {
        // Log error
        $log.error(error);
      }
    }
  }
}());
