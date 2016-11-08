(function () {
  'use strict';

  angular
    .module('programs')
    .controller('ProgramsListController', ProgramsListController);

  ProgramsListController.$inject = ['ProgramsService'];

  function ProgramsListController(ProgramsService) {
    var vm = this;
    console.log ('inside list controller');

    vm.programs = ProgramsService.query();
  }
}());
