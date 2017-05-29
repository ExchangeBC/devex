(function () {
  'use strict';

  angular
    .module('notifications')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(notificationuser, currentUser) {
       return notificationuser === currentUser;
   };
}());
