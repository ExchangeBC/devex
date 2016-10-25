(function () {
  'use strict';

  angular
    .module('programs')
    .controller('ProgramsController', ProgramsController);

  ProgramsController.$inject = ['$scope', 'programResolve', 'Authentication'];

  function ProgramsController($scope, program, Authentication) {
    var vm = this;

    vm.program = program;
    vm.authentication = Authentication;

  }
}());
