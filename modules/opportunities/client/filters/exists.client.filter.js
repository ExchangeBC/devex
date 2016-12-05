(function () {
  'use strict';

  angular
    .module('opportunities')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(opportunityuser, currentUser) {
       return opportunityuser === currentUser;
   };
}());
