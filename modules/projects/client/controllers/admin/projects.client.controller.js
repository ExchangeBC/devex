(function () {
  'use strict';

  angular
    .module('projects.admin')
    .controller('ProjectsAdminController', ProjectsAdminController);

  ProjectsAdminController.$inject = ['$scope', '$state', '$window', 'projectResolve', 'Authentication', 'Notification'];

  function ProjectsAdminController($scope, $state, $window, project, Authentication, Notification) {
    var vm = this;

    vm.project = project;
    vm.authentication = Authentication;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Project
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.project.$remove(function() {
          $state.go('admin.projects.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Project deleted successfully!' });
        });
      }
    }

    // Save Project
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
        return false;
      }

      // Create a new project, or update the current instance
      vm.project.createOrUpdate()
        .then(successCallback)
        .catch(errorCallback);

      function successCallback(res) {
        $state.go('admin.projects.list'); // should we send the User to the list or the updated Project's view?
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Project saved successfully!' });
      }

      function errorCallback(res) {
        Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Project save error!' });
      }
    }
  }
}());
