(function () {
	'use strict';

	angular
		.module('users')
		.controller('EditProfileController', EditProfileController);

	EditProfileController.$inject = ['$scope', '$state', 'modalService', 'dataService', 'UsersService', 'Authentication', 'Notification'];

	function EditProfileController($scope, $state, modalService, dataService, UsersService, Authentication, Notification) {
		var vm               = this;
		var isUser           = Authentication.user;
		var wasGov           = isUser && !!~Authentication.user.roles.indexOf ('gov');
		var wasGovRequest    = isUser && !!~Authentication.user.roles.indexOf ('gov-request');
		vm.hasCompany = isUser && Authentication.user.orgsAdmin.length > 0;
		//
		// deep copy the model, as we don't want to update until saved
		//
		vm.user              = angular.copy(Authentication.user);
		vm.updateUserProfile = updateUserProfile;
		vm.isgov = (wasGov || wasGovRequest);
		vm.goveditable = !wasGov && !vm.hasCompany;
		var pristineUser = angular.toJson(Authentication.user);
		vm.cities           = dataService.cities;
		vm.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     :'',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};

		var saveChangesModalOpt = {
				closeButtonText: 'Return User Profile Page',
				actionButtonText: 'Continue',
				headerText: 'Unsaved Changes!',
				bodyText: 'You have unsaved changes. Changes will be discarded if you continue.'
		};

		var $locationChangeStartUnbind = $scope.$on('$stateChangeStart', function (event, toState, toParams) {
			if (pristineUser !== angular.toJson(vm.user)) {
				if (toState.retryInProgress) {
					toState.retryInProgress = false;
					return;
				}
				modalService.showModal({}, saveChangesModalOpt)
					.then(function () {
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
			var successMessage = '<h4>Changes Saved</h4>';
			var user = new UsersService(vm.user);
			user.$update(function (response) {
				$scope.$broadcast('show-errors-reset', 'vm.userForm');

				Notification.success({ delay:2000, message: '<i class="fa fa-3x fa-check-circle"></i> '+successMessage});
				Authentication.user = response;
				vm.user = angular.copy(Authentication.user);
				pristineUser = angular.toJson(Authentication.user);
			}, function (response) {
				Notification.error({ message: response.data.message, title: '<i class="fa fa-3x fa-exclamation-triangle"></i> Edit profile failed!' });
			});
		}
		vm.delete = function () {
			if ((confirm('Are you sure that you want to be removed from the BCDevExchange?')) && (confirm('Are you really sure?'))) {
					window.location = '/api/users/delete';
			}
		}
	}
}());
