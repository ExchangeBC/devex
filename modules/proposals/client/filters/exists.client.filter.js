(function () {
  'use strict';

  angular
    .module('proposals')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(proposaluser, currentUser) {
       return proposaluser === currentUser;
   };
}());
