(function () {
  'use strict';

  angular
    .module('teams')
    .controller('TeamsListController', TeamsListController);

  TeamsListController.$inject = ['TeamsService'];

  function TeamsListController(TeamsService) {
    var vm = this;

    vm.teams = TeamsService.query();
  }
}());
