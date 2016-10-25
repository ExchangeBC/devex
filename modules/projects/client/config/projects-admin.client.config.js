(function () {
  'use strict';

  // Configuring the Projects Admin module
  angular
    .module('projects.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Projects',
      state: 'admin.projects.list'
    });
  }
}());
