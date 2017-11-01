(function () {
  'use strict';

  angular
    .module('orgs.services')
    .factory('OrgsService', OrgsService);

  OrgsService.$inject = ['$resource', '$log'];

  function OrgsService($resource, $log) {
    var Org = $resource('/api/orgs/:orgId', {
      orgId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      my: {
        method: 'GET',
        url: '/api/my/orgs',
        isArray: true
      }
    });

    angular.extend(Org.prototype, {
      createOrUpdate: function () {
        var org = this;
        return createOrUpdate(org);
      }
    });

    return Org;

    function createOrUpdate(org) {
      if (org._id) {
        return org.$update(onSuccess, onError);
      } else {
        return org.$save(onSuccess, onError);
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
    }

    function handleError(error) {
      // Log error
      $log.error(error);
    }
  }
}());
