(function () {
  'use strict';

  angular
    .module('teams.services')
    .factory('TeamsService', TeamsService);

  TeamsService.$inject = ['$resource', '$log'];

  function TeamsService($resource, $log) {
    var Team = $resource('/api/teams/:teamId', {
      teamId: '@_id'
    }, {
      update: {
        method: 'PUT'
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
      function onSuccess(team) {
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
