(function () {
	'use strict';

	angular
		.module('users')
		.controller('ChangeProfilePictureController', ChangeProfilePictureController);

	ChangeProfilePictureController.$inject = ['$timeout', 'AuthenticationService', 'Upload', 'Notification'];

	function ChangeProfilePictureController($timeout, authenticationService, Upload, Notification) {
		var vm = this;

		vm.user = authenticationService.user;
		vm.fileSelected = false;

		vm.upload = function (dataUrl, name) {
			Upload.upload({
				url: '/api/users/picture',
				data: {
					newProfilePicture: Upload.dataUrltoBlob(dataUrl, name)
				}
			}).then(function (response) {
				$timeout(function () {
					onSuccessItem(response.data);
				});
			}, function (response) {
				if (response.status > 0) onErrorItem(response.data);
			}, function (evt) {
				vm.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
			});
		};

		// Called after the user has successfully uploaded a new picture
		function onSuccessItem(response) {
			// Show success message
			Notification.success({ message: '<i class="fas fa-check-circle"></i> Change profile picture successful!' });

			// Populate user object
			vm.user = authenticationService.user = response;

			// Reset form
			vm.fileSelected = false;
			vm.progress = 0;
		}

		// Called after the user has failed to uploaded a new picture
		function onErrorItem(response) {
			vm.fileSelected = false;

			// Show error message
			Notification.error({ message: response.message, title: '<i class="fas fa-exclamation-triangle"></i> Change profile picture failed!' });
		}
	}
}());
