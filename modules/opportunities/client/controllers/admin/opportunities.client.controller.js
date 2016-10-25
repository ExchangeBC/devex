(function () {
  'use strict';

  angular
    .module('opportunities.admin')
    .controller('OpportunitiesAdminController', OpportunitiesAdminController);

  OpportunitiesAdminController.$inject = ['$scope', '$state', '$window', 'opportunityResolve', 'Authentication', 'Notification'];

  function OpportunitiesAdminController($scope, $state, $window, opportunity, Authentication, Notification) {
    var vm = this;

    vm.opportunity = opportunity;
    vm.authentication = Authentication;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Opportunity
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.opportunity.$remove(function() {
          $state.go('admin.opportunities.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Opportunity deleted successfully!' });
        });
      }
    }

    // Save Opportunity
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
        return false;
      }

      // Create a new opportunity, or update the current instance
      vm.opportunity.createOrUpdate()
        .then(successCallback)
        .catch(errorCallback);

      function successCallback(res) {
        $state.go('admin.opportunities.list'); // should we send the User to the list or the updated Opportunity's view?
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Opportunity saved successfully!' });
      }

      function errorCallback(res) {
        Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Opportunity save error!' });
      }
    }
  }
}());
