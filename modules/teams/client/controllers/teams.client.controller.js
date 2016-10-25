(function () {
  'use strict';

  angular
    .module('teams')
    .controller('TeamsController', TeamsController);

  TeamsController.$inject = ['$scope', 'teamResolve', 'Authentication'];

  function TeamsController($scope, team, Authentication) {
    var vm = this;

    vm.team = team;
    vm.authentication = Authentication;

  }
}());
