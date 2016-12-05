(function () {
  'use strict';

  angular
    .module('opportunities')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Opportunities',
      state: 'opportunities',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'opportunities', {
      title: 'List Opportunities',
      state: 'opportunities.list'
    });

    // Add the dropdown create item
    menuService.addSubMenuItem('topbar', 'opportunities', {
      title: 'Create Opportunity',
      state: 'opportunities.create',
      roles: ['user']
    });
  }
}());
