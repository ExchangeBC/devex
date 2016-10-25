(function () {
  'use strict';

  // Configuring the Teams Admin module
  angular
    .module('teams.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Teams',
      state: 'admin.teams.list'
    });
  }
}());
