(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', '$location', 'Authentication', 'menuService'];

  function HeaderController($scope, $state, $location, Authentication, menuService, flags) {
    var vm = this;
    vm.accountMenu = menuService.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = menuService.getMenu('topbar');

    // console.log ('window.features:', window.features);

    $scope.$on('$stateChangeSuccess', stateChangeSuccess);
    $scope.isHomePage = function() {
        var path = $location.path();
        return (! path) || path === '/';
    };
    $scope.isActiveMenu = function(item) {
        var route = item.state || '',
            active = $state.current.name || '',
            mr = route.match(/^(.*)\.(list)$/),
            ma = active.match(/^(.*)\.(edit|view|list)$/);
        if (mr) route = mr[1];
        if (ma) active = ma[1];
        if (route === active)
            return true;
        if (route === 'admin' && active.substring(0, 5) === 'admin')
            return true;
    };

    function stateChangeSuccess() {
      // Collapsing the menu after navigation
      vm.isCollapsed = false;
    }
  }


}());
