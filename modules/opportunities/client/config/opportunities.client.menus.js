(function () {
  'use strict';

  angular
    .module('opportunities')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Opportunities',
      state: 'opportunities',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'opportunities', {
      title: 'List Opportunities',
      state: 'opportunities.list',
      roles: ['*']
    });
  }
}());
