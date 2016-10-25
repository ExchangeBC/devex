(function () {
  'use strict';

  angular
    .module('teams.admin')
    .controller('TeamsAdminController', TeamsAdminController);

  TeamsAdminController.$inject = ['$scope', '$state', '$window', 'teamResolve', 'Authentication', 'Notification'];

  function TeamsAdminController($scope, $state, $window, team, Authentication, Notification) {
    var vm = this;

    vm.team = team;
    vm.authentication = Authentication;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Team
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.team.$remove(function() {
          $state.go('admin.teams.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Team deleted successfully!' });
        });
      }
    }

    // Save Team
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.teamForm');
        return false;
      }

      // Create a new team, or update the current instance
      vm.team.createOrUpdate()
        .then(successCallback)
        .catch(errorCallback);

      function successCallback(res) {
        $state.go('admin.teams.list'); // should we send the User to the list or the updated Team's view?
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Team saved successfully!' });
      }

      function errorCallback(res) {
        Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Team save error!' });
      }
    }
  }
}());
