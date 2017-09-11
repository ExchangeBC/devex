(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  function HomeController(Authentication) {
    var vm = this;
    vm.isUser = Authentication.user;
  }
}());
