(function () {
  'use strict';

  // Configuring the Opportunities Admin module
  angular
    .module('opportunities.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Opportunities',
      state: 'admin.opportunities.list'
    });
  }
}());
