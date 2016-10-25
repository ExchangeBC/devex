(function () {
  'use strict';

  angular
    .module('opportunities.admin')
    .controller('OpportunitiesAdminListController', OpportunitiesAdminListController);

  OpportunitiesAdminListController.$inject = ['OpportunitiesService'];

  function OpportunitiesAdminListController(OpportunitiesService) {
    var vm = this;

    vm.opportunities = OpportunitiesService.query();
  }
}());
