(function () {
  'use strict';

  angular
    .module('projects')
    .controller('ProjectsController', ProjectsController);

  ProjectsController.$inject = ['$scope', 'projectResolve', 'Authentication'];

  function ProjectsController($scope, project, Authentication) {
    var vm = this;

    vm.project = project;
    vm.authentication = Authentication;

  }
}());
