(function () {
  'use strict';

  angular
    .module('users')
    .controller('EditProfileController', EditProfileController);

  EditProfileController.$inject = ['$scope', '$http', '$location', '$state', 'modalService', 'UsersService', 'Authentication', 'Notification', 'subscriptions'];

  function EditProfileController($scope, $http, $location, $state, modalService, UsersService, Authentication, Notification, subscriptions) {
    var vm               = this;
    var isUser           = Authentication.user;
    var wasGov           = isUser && !!~Authentication.user.roles.indexOf ('gov');
    var wasGovRequest    = isUser && !!~Authentication.user.roles.indexOf ('gov-request');
    //
    // deep copy the model, as we don't want to update until saved
    //
    vm.user              = angular.copy(Authentication.user);
    vm.updateUserProfile = updateUserProfile;
    vm.isgov = (wasGov || wasGovRequest);
    vm.goveditable = !wasGov;
    var pristineUser = angular.toJson(Authentication.user);
    //
    // TEMPRARY HACK HACK HACK
    //
    // until such time as make a dynamic list of notifications the user has subscriibed to
    // we will sontinue to use the flag on the user schema 'notifiyOpportunities'.  however,
    // instead of using it as the gospel truth, we set it to true on entry here only if the
    // user has a proper subscription (one of the subs is 'not-add-opportunity').
    // we will then set the flag using the user interface as usual, and that value is returned as usual
    // to the back end, which then triggers the setting or removal of that subscription
    // in future we will set the flag and use a side process to set of unset the subscription
    //
    // console.log (subscriptions);
    vm.user.notifyOpportunities = subscriptions.map (function (s) {return (s.notificationCode === 'not-add-opportunity');}).reduce (function (a, c) {return (a || c);}, false);

    var saveChangesModalOpt = {
        closeButtonText: 'Return User Profile Page',
        actionButtonText: 'Continue',
        headerText: 'Unsaved Changes!',
        bodyText: 'You have unsaved changes. Changes will be discarded if you continue.'
    };

    var $locationChangeStartUnbind = $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (pristineUser !== angular.toJson(vm.user)) {
        if (toState.retryInProgress) {
          toState.retryInProgress = false;
          return;
        }
        modalService.showModal({}, saveChangesModalOpt)
          .then(function continueStateChange (result) {
            toState.retryInProgress = true;
            $state.go(toState, toParams);
          }, function() {

          });
          event.preventDefault();
      }
    });

    $scope.$on('$destroy', function () {
      window.onbeforeunload = null;
      $locationChangeStartUnbind();
    });

    // Update a user profile
    function updateUserProfile(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      //
      // ensure that these flags aren't saved if email is not given
      //
      if (vm.user.email == null || vm.user.email === '') {
        vm.user.notifyOpportunities = false;
        vm.user.notifyEvents = false;
        vm.isgov = false;
      }

      //
      // if changes to government flag ...
      //
      if (!wasGov) {
        if (vm.isgov) {
          vm.user.addRequest = true;
          vm.user.removeRequest = false;
        } else {
          vm.user.addRequest = false;
          vm.user.removeRequest = true;
        }
      }
      //
      // examine the developer flag, cant be looking for opps if gov user
      //
      if (vm.isgov) {
        vm.user.isDeveloper = false;
      }
      var govRequest = vm.user.addRequest;
      var successMessage = '<h4>Edit profile successful</h4>';
      if (govRequest) {
        successMessage += '<p>You have requested government user access, the request is now posted for review. You will receive the goverment access and be able to access gov user functionality as soon as the admin verifies you as government user.</p>';
      }
      if (vm.user.notifyOpportunities) {
        successMessage += '<p>We will send you notifications of new Code With Us Opportunities.</p>';
      }
      if (vm.user.notifyEvents) {
        successMessage += '<p>We will notify you of upcoming events.</p>';
      }
      if (vm.user.notifyBlogs) {
        successMessage += '<p>We will notify you of new blog posts.</p>';
      }
      var user = new UsersService(vm.user);
      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        Notification.success({ delay:5000, message: '<i class="glyphicon glyphicon-ok"></i> '+successMessage});
        Authentication.user = response;
        vm.user = angular.copy(Authentication.user);
        pristineUser = angular.toJson(Authentication.user);
      }, function (response) {
        Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit profile failed!' });
      });
    }
  }
}());
