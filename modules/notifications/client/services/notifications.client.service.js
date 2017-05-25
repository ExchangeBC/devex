// Notifications service used to communicate Notifications REST endpoints
(function () {
  'use strict';

  angular
    .module('notifications')
    .factory('NotificationsService', NotificationsService);

  NotificationsService.$inject = ['$resource', '$log'];

  function NotificationsService($resource, $log) {
    var Notification = $resource('/api/notifications/:notificationId', {
      notificationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      forProgram: {
        method: 'GET',
        url: '/api/notifications/for/program/:programId',
        isArray: true
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/notification/:notificationId'
      },
      my: {
        method: 'GET',
        url: '/api/my/notifications',
        isArray: true
      },
      myadmin: {
        method: 'GET',
        url: '/api/myadmin/notifications',
        isArray: true
      },
      getRequests: {
        method: 'GET',
        url :'/api/notifications/requests/:notificationId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/notifications/members/:notificationId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/notifications/requests/confirm/:notificationId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/notifications/requests/deny/:notificationId/:userId'
      }
    });

    angular.extend(Notification.prototype, {
      createOrUpdate: function () {
        var notification = this;
        return createOrUpdate(notification);
      }
    });
    return Notification;

    function createOrUpdate(notification) {
      if (notification._id) {
        return notification.$update(onSuccess, onError);
      } else {
        return notification.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(notification) {
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
