(function () {
  'use strict';

  angular
    .module('opportunities')
    .controller('OpportunitiesListController', OpportunitiesListController);

  OpportunitiesListController.$inject = ['OpportunitiesService'];

  function OpportunitiesListController(OpportunitiesService) {
    var vm = this;

    vm.opportunities = OpportunitiesService.query();
  }
}());
