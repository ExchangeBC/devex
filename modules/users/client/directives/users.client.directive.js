(function () {
	'use strict';
	angular.module ('users')
	// -------------------------------------------------------------------------
	//
	// force lowercase input
	//
	// -------------------------------------------------------------------------
	.directive ('lowercase', function () {
		return {
			require: 'ngModel',
			link: function (scope, element, attrs, modelCtrl) {
				modelCtrl.$parsers.push (function (input) {
					return input ? input.toLowerCase() : '';
				});
				element.css ('text-transform', 'lowercase');
			}
		};
	})
	// -------------------------------------------------------------------------
	//
	// directive, modal edit profile pic
	//
	// -------------------------------------------------------------------------
	.directive ('editProfileImage', function () {
		return {
			require: 'ngModel',
			scope: {
				ngModel: '=',
				options: '=',
				org: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-default" ng-click="wsx.edit()">Upload new picture</button>',
			controller: function ($scope, $uibModal, $timeout, Authentication, Upload, Notification) {
				var wsx = this;
				var uploadurl = '/api/users/picture';
				console.log ('org:', $scope.org);
				if ($scope.org) {
					uploadurl = '/api/upload/logo/org/'+$scope.org._id
				}
				wsx.edit = function () {
					console.log ('what');
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/users/client/views/settings/change-profile-modal.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: function ($timeout, Authentication, $uibModalInstance, Upload, Notification) {
							var qqq = this;
							qqq.user = Authentication.user;
							qqq.fileSelected = false;

							qqq.upload = function (dataUrl, name) {
								Upload.upload({
									url: uploadurl,
									data: {
										newProfilePicture: Upload.dataUrltoBlob(dataUrl, name)
									}
								}).then(function (response) {
									$uibModalInstance.dismiss('cancel');
									$timeout(function () {
										onSuccessItem(response.data);
									});
								}, function (response) {
									if (response.status > 0) onErrorItem(response.data);
								}, function (evt) {
									qqq.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
								});
							};

							// Called after the user has successfully uploaded a new picture
							function onSuccessItem(response) {
								// Show success message
								Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Change profile picture successful!' });
								// Populate user object
								qqq.user = Authentication.user = response;
								// Reset form
								qqq.fileSelected = false;
								qqq.progress = 0;
							}

							// Called after the user has failed to uploaded a new picture
							function onErrorItem(response) {
								qqq.fileSelected = false;
								// Show error message
								Notification.error({ message: response.message, title: '<i class="glyphicon glyphicon-remove"></i> Change profile picture failed!' });
							}

							qqq.quitnow = function () { $uibModalInstance.dismiss('cancel'); }
						}
					})
					// .result.finally (function () {
					// 	$state.go ($state.previous.state, $state.previous.params);
					// });
					;
				}
			}
		};
	})
	;
}());
