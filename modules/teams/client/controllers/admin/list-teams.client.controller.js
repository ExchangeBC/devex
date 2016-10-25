(function () {
  'use strict';

  angular
    .module('teams.admin')
    .controller('TeamsAdminListController', TeamsAdminListController);

  TeamsAdminListController.$inject = ['TeamsService'];

  function TeamsAdminListController(TeamsService) {
    var vm = this;

    vm.teams = TeamsService.query();
  }
}());
