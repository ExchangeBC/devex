(function () {
  'use strict';

  angular
    .module('activities.services')
    .factory('ActivitiesService', ActivitiesService);

  ActivitiesService.$inject = ['$resource', '$log'];

  function ActivitiesService($resource, $log) {
    var Activity = $resource('/api/activities/:activityId', {
      activityId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      forProgram: {
        method: 'GET',
        url: '/api/activities/for/program/:programId'
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/activity/:activityId'
      },
      getRequests: {
        method: 'GET',
        url :'/api/activities/requests/:activityId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/activities/members/:activityId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/activities/requests/confirm/:activityId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/activities/requests/deny/:activityId/:userId'
      }
    });

    angular.extend(Activity.prototype, {
      createOrUpdate: function () {
        var activity = this;
        return createOrUpdate(activity);
      }
    });

    return Activity;

    function createOrUpdate(activity) {
      console.log ('create or update');
      if (activity._id) {
        return activity.$update(onSuccess, onError);
      } else {
        return activity.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(activity) {
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
