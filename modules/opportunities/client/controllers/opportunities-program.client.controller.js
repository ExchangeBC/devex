/**
 * Created by Shawn on 21/11/2016.
 */
(function () {
  'use strict';

  // Opportunities controller
  angular
    .module('opportunities')
    .controller('OpportunitiesController', OpportunitiesController);

  OpportunitiesController.$inject = ['$scope', '$state', '$window', 'Authentication', 'opportunityResolve'];

  function OpportunitiesController ($scope, $state, $window, Authentication, opportunity) {
    var vm = this;

    vm.authentication = Authentication;
    vm.opportunity = opportunity;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Opportunity
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.opportunity.$remove($state.go('opportunities.list'));
      }
    }

    // Save Opportunity
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.opportunity._id) {
        vm.opportunity.$update(successCallback, errorCallback);
      } else {
        vm.opportunity.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('opportunities.view', {
          opportunityId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }


  angular.module('app',[]).controller('myCtrl',function($scope) {
    $scope.units = [
      {'id': 10, 'label': 'test1'},
      {'id': 27, 'label': 'test2'},
      {'id': 39, 'label': 'test3'}
    ]

    $scope.data = {
      'id': 1,
      'unit': 27
    }

  });


  function OpportunitiesSelectedProgram() {
    var mongoose = require('mongoose');
    var Program = mongoose.model('Program', {name: String});
    var program = Program.find({}, function(err, program) {
      if (err){
        console.log(err);
        return err; // json(err);
      }
      else {
        return program; // json(program);
      }
    });
  }
}());
