(function () {
  'use strict';

  angular
    .module('users.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the Users module
  function menuConfig(menuService) {
    menuService.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users'
    });
    menuService.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Gov. Request',
      state: 'admin.govs'
    });
    menuService.addSubMenuItem('topbar', 'admin', {
      title: 'Notify of Opportunities',
      state: 'admin.notifyopps'
    });
    menuService.addSubMenuItem('topbar', 'admin', {
      title: 'Notify of Events',
      state: 'admin.notifymeets'
    });
  }
}());
