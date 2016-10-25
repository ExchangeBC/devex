(function () {
  'use strict';

  // Configuring the Programs Admin module
  angular
    .module('programs.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Programs',
      state: 'admin.programs.list'
    });
  }
}());
