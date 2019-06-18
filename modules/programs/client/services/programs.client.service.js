(function () {
  'use strict';

  angular
    .module('programs.services')
    .factory('ProgramsService', ProgramsService);

  ProgramsService.$inject = ['$resource', '$log'];

  function ProgramsService($resource, $log) {
    var Program = $resource('/api/programs/:programId', {
      programId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/program/:programId'
      },
      myadmin: {
        method: 'GET',
        url: '/api/myadmin/programs',
        isArray: true
      },
      getRequests: {
        method: 'GET',
        url :'/api/programs/requests/:programId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/programs/members/:programId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/programs/requests/confirm/:programId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/programs/requests/deny/:programId/:userId'
      }
    });

    angular.extend(Program.prototype, {
      createOrUpdate: function () {
        var program = this;
        return createOrUpdate(program);
      }
    });

    return Program;

    function createOrUpdate(program) {
      if (program._id) {
        return program.$update(onSuccess, onError);
      } else {
        return program.$save(onSuccess, onError);
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
