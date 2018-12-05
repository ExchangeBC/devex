(function() {
	'use strict';

	angular
		.module('users')

		// -------------------------------------------------------------------------
		//
		// overarching settings controller, does not do anything really
		//
		// -------------------------------------------------------------------------
		.controller('SettingsController', [
			'Authentication',
			function(Authentication) {
				var vm = this;
				vm.user = Authentication.user;
			}
		])
		// -------------------------------------------------------------------------
		//
		// controller for privacy
		//
		// -------------------------------------------------------------------------
		.controller('ProfilePrivacyController', [
			'$scope',
			'Authentication',
			'UsersService',
			'Notification',
			function($scope, Authentication, UsersService, Notification) {
				var vm = this;
				vm.user = angular.copy(Authentication.user);
				vm.savePrivacy = function(isValid) {
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
						return false;
					}
					var successMessage = '<h4>Changes Saved</h4>';
					var user = new UsersService(vm.user);
					user.$update(
						function(response) {
							$scope.$broadcast('show-errors-reset', 'vm.userForm');
							Notification.success({
								delay: 2000,
								message: '<i class="fas fa-3x fa-check-circle"></i> ' + successMessage
							});
							Authentication.user = response;
							vm.user = angular.copy(Authentication.user);
						},
						function(response) {
							Notification.error({
								message: response.data.message,
								title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Edit profile failed!'
							});
						}
					);
				};
			}
		])
		// -------------------------------------------------------------------------
		//
		// controller for skills
		//
		// -------------------------------------------------------------------------
		.controller('ProfileSkillsController', [
			'$scope',
			'$sce',
			'Notification',
			'Authentication',
			'UsersService',
			'capabilities',
			'CapabilitiesCommon',
			'TINYMCE_OPTIONS',
			function(
				$scope,
				$sce,
				Notification,
				Authentication,
				UsersService,
				capabilities,
				CapabilitiesCommon,
				TINYMCE_OPTIONS
			) {
				var vm = this;
				vm.trust = $sce.trustAsHtml;
				vm.user = angular.copy(Authentication.user);
				vm.tinymceOptions = TINYMCE_OPTIONS;
				//
				// set up the structures for capabilities
				//
				CapabilitiesCommon.init(vm, vm.user, capabilities);
				capabilities.forEach(function(cap) {
					cap.isOpen = false;
				});
				// -------------------------------------------------------------------------
				//
				// perform the actual update
				//
				// -------------------------------------------------------------------------
				vm.updateUserProfile = function(isValid) {
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
						return false;
					}
					//
					// reconcile the meta version of the capability data into the model
					//
					CapabilitiesCommon.reconcile(vm, vm.user);
					//
					// do the update
					//
					new UsersService(vm.user).$update(
						function(response) {
							Authentication.user = response;
							vm.user = angular.copy(Authentication.user);
							$scope.$broadcast('show-errors-reset', 'vm.userForm');
							Notification.success({
								delay: 2000,
								message: '<i class="fas fa-3x fa-check-circle"></i> <h4>Changes saved</h4>'
							});
							CapabilitiesCommon.init(vm, vm.user, capabilities);
						},
						function(response) {
							Notification.error({
								message: response.data.message,
								title: '<i class="fas fa-alert-triangle"></i> Changes were not saved!'
							});
						}
					);
				};
			}
		])
		// -------------------------------------------------------------------------
		//
		// controller for messages
		//
		// -------------------------------------------------------------------------
		.controller('ProfileMessagesController', [
			'Authentication',
			function(Authentication) {
				var vm = this;
				vm.user = Authentication.user;
			}
		])
		// -------------------------------------------------------------------------
		//
		// controller for affiliations
		//
		// -------------------------------------------------------------------------
		.controller('ProfileAffiliationsController', [
			'Authentication',
			function(Authentication) {
				var vm = this;
				vm.user = Authentication.user;
			}
		]);
}());
