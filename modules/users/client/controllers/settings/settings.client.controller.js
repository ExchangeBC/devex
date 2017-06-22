(function () {
  'use strict';

  angular
    .module('users')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'Authentication', 'UsersService', '$location'];

  function SettingsController($scope, Authentication, UsersService, $location) {
    var vm = this;

    vm.delete = function () {
    	if (confirm('Are you sure that you want to be removed from the Developer\'s Exchange?')) {
    		if (confirm('Are you really sure?')) {
    			// UsersService.removeSelf(function () {
    				window.location = '/api/users/delete';
	    			// $location.path('/');
    			// }
          // );
    		}
    	}
    }

    vm.user = Authentication.user;
  }
}());
