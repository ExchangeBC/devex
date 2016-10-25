(function () {
  'use strict';

  angular
    .module('projects.admin')
    .controller('ProjectsAdminListController', ProjectsAdminListController);

  ProjectsAdminListController.$inject = ['ProjectsService'];

  function ProjectsAdminListController(ProjectsService) {
    var vm = this;

    vm.projects = ProjectsService.query();
  }
}());
