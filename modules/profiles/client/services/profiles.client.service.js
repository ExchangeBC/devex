(function () {
  'use strict';

  angular
    .module('profiles.services')
    .factory('ProfilesService', ProfilesService);

  ProfilesService.$inject = ['$resource', '$log'];

  function ProfilesService($resource, $log) {
    var Profile = $resource('/api/profiles/:profileId', {
      profileId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      my: {
        method: 'GET',
        url: '/api/my/profiles',
        isArray: true
      }
    });

    angular.extend(Profile.prototype, {
      createOrUpdate: function () {
        var profile = this;
        return createOrUpdate(profile);
      }
    });

    return Profile;

    function createOrUpdate(profile) {
      if (profile._id) {
        return profile.$update(onSuccess, onError);
      } else {
        return profile.$save(onSuccess, onError);
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
