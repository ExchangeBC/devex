/**
 * Created by Shawn on 21/11/2016.
 */
(function () {
  'use strict';

  // Projects controller
  angular
    .module('projects')
    .controller('ProjectsController', ProjectsController);

  ProjectsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'projectResolve'];

  function ProjectsController ($scope, $state, $window, Authentication, project) {
    var vm = this;

    vm.authentication = Authentication;
    vm.project = project;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Project
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.project.$remove($state.go('projects.list'));
      }
    }

    // Save Project
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.project._id) {
        vm.project.$update(successCallback, errorCallback);
      } else {
        vm.project.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('projects.view', {
          projectId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }


  angular.module("app",[]).controller("myCtrl",function($scope) {
    $scope.units = [
      {'id': 10, 'label': 'test1'},
      {'id': 27, 'label': 'test2'},
      {'id': 39, 'label': 'test3'},
    ]

    $scope.data = {
      'id': 1,
      'unit': 27
    }

  });


  function ProjectsSelectedProgram() {
    var mongoose = require('mongoose');
    var Program = mongoose.model('Program', {name: String});
    var program = Program.find({}, function(err, program) {
      if (err){
        console.log(err);
        return json(err);
      }
      else {
        return json(program);
      }
    });
  }
}());
