(function () {
  'use strict';

  angular
    .module('projects')
    .filter('exists', exists);

  exists.$inject = [/* Example: '$state', '$window' */];

  function exists(projectuser, currentUser) {
       return projectuser === currentUser;
   };
}());
