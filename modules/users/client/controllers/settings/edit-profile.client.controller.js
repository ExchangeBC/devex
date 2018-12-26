(function () {
	'use strict';

	angular
		.module('users')
		.controller('EditProfileController', EditProfileController);

	EditProfileController.$inject = ['$scope', '$state', 'modalService', 'dataService', 'UsersService', 'authenticationService', 'Notification', 'ask'];

	function EditProfileController($scope, $state, modalService, dataService, UsersService, authenticationService, Notification, ask) {
		var vm               	= this;
		var isUser           	= authenticationService.user;
		vm.isGov           		= isUser && !!~authenticationService.user.roles.indexOf ('gov');
		vm.pendingGovRequest   	= isUser && !!~authenticationService.user.roles.indexOf ('gov-request');
		vm.hasCompany 			= isUser && authenticationService.user.orgsAdmin.length > 0;
		//
		// deep copy the model, as we don't want to update until saved
		//
		vm.user              = angular.copy(authenticationService.user);
		vm.updateUserProfile = updateUserProfile;

		var pristineUser = angular.toJson(authenticationService.user);
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

			if (vm.isgov) {
				vm.user.isDeveloper = false;
			}

			var successMessage = '<h4>Changes Saved</h4>';
			var user = new UsersService(vm.user);
			user.$update(function (response) {
				$scope.$broadcast('show-errors-reset', 'vm.userForm');

				Notification.success({ delay:2000, message: '<i class="fas fa-3x fa-check-circle"></i> '+successMessage});
				authenticationService.user = response;
				vm.user = angular.copy(authenticationService.user);
				pristineUser = angular.toJson(authenticationService.user);
			}, function (response) {
				Notification.error({ message: response.data.message, title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Edit profile failed!' });
			});
		}

		vm.addGovtRequest = function() {
			var question = 'Are you sure you want to request verification as a public sector employee?';
			ask.yesNo(question)
			.then(function(answer) {
				if (answer) {
					var user = new UsersService(authenticationService.user);
					user.addRequest = true;
					user.$update(
						function(response) {
							vm.pendingGovRequest = true;
							authenticationService.user = response;
							Notification.success({
								message: '<i class="fas fa-3x fa-check-circle"></i> Verification request sent!'
							});
						},
						function(err) {
							Notification.error({
								message: err.data.message, title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Verification request failed!'
							});
						}
					);
				}
			});
		}

		vm.delete = function () {
			ask.yesNo('Please confirm you want to be removed from the BC Developer\'s Exchange')
			.then((answer) => {
				if (answer) {
					UsersService.removeSelf().$promise
					.then((response) => {
						window.location = '/';
						Notification.success({
							title: 'Success',
							message: response.message
						});
					})
					.catch((response) => {
						Notification.error({
							title: 'Error',
							message: response.message
						});
					});
				}
			})
		}
	}
}());
