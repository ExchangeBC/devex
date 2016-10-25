(function () {
  'use strict';

  angular
    .module('opportunities')
    .controller('OpportunitiesController', OpportunitiesController);

  OpportunitiesController.$inject = ['$scope', 'opportunityResolve', 'Authentication'];

  function OpportunitiesController($scope, opportunity, Authentication) {
    var vm = this;

    vm.opportunity = opportunity;
    vm.authentication = Authentication;

  }
}());
