(function () {
  'use strict';

  angular
    .module('teams')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(teamuser, currentUser) {
       return teamuser === currentUser;
   };
}());
