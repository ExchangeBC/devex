(function () {
  'use strict';

  angular
    .module('users')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'Authentication'];

  function SettingsController($scope, Authentication) {
    var vm = this;

    vm.delete = function () {
    	if ((confirm('Are you sure that you want to be removed from the Developer\'s Exchange?')) && (confirm('Are you really sure?'))) {
    			window.location = '/api/users/delete';
    	}
    }

    vm.user = Authentication.user;
  }
}());
