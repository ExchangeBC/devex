// Teams service used to communicate Teams REST endpoints
(function () {
  'use strict';

  angular
    .module('teams')
    .factory('TeamsService', TeamsService);

  TeamsService.$inject = ['$resource', '$log'];

  function TeamsService($resource, $log) {
    var Team = $resource('/api/teams/:teamId', {
      teamId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      forOrg: {
        method: 'GET',
        url: '/api/teams/for/org/:orgId',
        isArray: true
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/team/:teamId'
      },
      my: {
        method: 'GET',
        url: '/api/my/teams',
        isArray: true
      },
      myadmin: {
        method: 'GET',
        url: '/api/myadmin/teams',
        isArray: true
      },
      getRequests: {
        method: 'GET',
        url :'/api/teams/requests/:teamId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/teams/members/:teamId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/teams/requests/confirm/:teamId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/teams/requests/deny/:teamId/:userId'
      }
    });

    angular.extend(Team.prototype, {
      createOrUpdate: function () {
        var team = this;
        return createOrUpdate(team);
      }
    });
    return Team;

    function createOrUpdate(team) {
      if (team._id) {
        return team.$update(onSuccess, onError);
      } else {
        return team.$save(onSuccess, onError);
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
