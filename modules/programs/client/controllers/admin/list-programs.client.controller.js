(function () {
  'use strict';

  angular
    .module('programs.admin')
    .controller('ProgramsAdminListController', ProgramsAdminListController);

  ProgramsAdminListController.$inject = ['ProgramsService'];

  function ProgramsAdminListController(ProgramsService) {
    var vm = this;

    vm.programs = ProgramsService.query();
  }
}());
