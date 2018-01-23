(function () {
  'use strict';

  angular
    .module('superbasics')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(superbasicuser, currentUser) {
       return superbasicuser === currentUser;
   };
}());
