// Superbasics service used to communicate Superbasics REST endpoints
(function () {
  'use strict';

  angular
    .module('superbasics')
    .factory('SuperbasicsService', SuperbasicsService);

  SuperbasicsService.$inject = ['$resource', '$log'];

  function SuperbasicsService($resource, $log) {
    var Superbasic = $resource('/api/superbasics/:superbasicId', {
      superbasicId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      forOrg: {
        method: 'GET',
        url: '/api/superbasics/for/org/:orgId',
        isArray: true
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/superbasic/:superbasicId'
      },
      my: {
        method: 'GET',
        url: '/api/my/superbasics',
        isArray: true
      },
      myadmin: {
        method: 'GET',
        url: '/api/myadmin/superbasics',
        isArray: true
      },
      getRequests: {
        method: 'GET',
        url :'/api/superbasics/requests/:superbasicId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/superbasics/members/:superbasicId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/superbasics/requests/confirm/:superbasicId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/superbasics/requests/deny/:superbasicId/:userId'
      }
    });

    angular.extend(Superbasic.prototype, {
      createOrUpdate: function () {
        var superbasic = this;
        return createOrUpdate(superbasic);
      }
    });
    return Superbasic;

    function createOrUpdate(superbasic) {
      if (superbasic._id) {
        return superbasic.$update(onSuccess, onError);
      } else {
        return superbasic.$save(onSuccess, onError);
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
