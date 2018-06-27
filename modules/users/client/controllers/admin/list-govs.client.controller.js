(function () {
  'use strict';

  angular
    .module('users.admin')
    .controller('GovListController', GovListController);

  GovListController.$inject = ['$filter', 'AdminService', '$window'];

  function GovListController($filter, AdminService, $window) {
    var vm = this;
     vm.approve = approve;
    vm.buildPager = buildPager;
    vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
    vm.pageChanged = pageChanged;

    AdminService.query(function (data) {
      vm.users = data;
      vm.buildPager();
    });

	function approve( flag,user) {
       AdminService.approve({flag:flag,user:user});
       $window.location.href = '/admin/govs';
    }
    function buildPager() {
      vm.pagedItems = [];
      vm.itemsPerPage = 15;
      vm.currentPage = 1;
      vm.figureOutItemsToDisplay();
    }

    function figureOutItemsToDisplay() {
      vm.filteredItems = $filter('filter')(vm.users, {
        $: vm.search,
        roles:'gov-request'
      });
      vm.filterLength = vm.filteredItems.length;
      var begin = ((vm.currentPage - 1) * vm.itemsPerPage);
      var end = begin + vm.itemsPerPage;
      vm.pagedItems = vm.filteredItems.slice(begin, end);
    }

    function pageChanged() {
      vm.figureOutItemsToDisplay();
    }
  }
}());
