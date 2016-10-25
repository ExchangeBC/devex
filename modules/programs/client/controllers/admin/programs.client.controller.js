(function () {
  'use strict';

  angular
    .module('programs.admin')
    .controller('ProgramsAdminController', ProgramsAdminController);

  ProgramsAdminController.$inject = ['$scope', '$state', '$window', 'programResolve', 'Authentication', 'Notification'];

  function ProgramsAdminController($scope, $state, $window, program, Authentication, Notification) {
    var vm = this;

    vm.program = program;
    vm.authentication = Authentication;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Program
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.program.$remove(function() {
          $state.go('admin.programs.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Program deleted successfully!' });
        });
      }
    }

    // Save Program
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.programForm');
        return false;
      }

      // Create a new program, or update the current instance
      vm.program.createOrUpdate()
        .then(successCallback)
        .catch(errorCallback);

      function successCallback(res) {
        $state.go('admin.programs.list'); // should we send the User to the list or the updated Program's view?
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Program saved successfully!' });
      }

      function errorCallback(res) {
        Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Program save error!' });
      }
    }
  }
}());
