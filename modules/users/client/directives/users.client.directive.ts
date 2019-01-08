/* tslint:disable */
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
	// directive for listing affiliations users have with their orgs
	//
	// -------------------------------------------------------------------------
	.directive('affiliationsList', function() {
		return {
			restrict		: 'E',
			controllerAs	: 'vm',
			scope			: {
				context		: '@'
			},
			templateUrl		: '/modules/users/client/views/settings/affiliations-directive.html',
			controller		: ['$scope', 'Notification', 'OrgService', 'AuthenticationService', 'ask', function($scope, Notification, OrgService, AuthenticationService, ask) {
				var vm 			= this;
				vm.auth			= AuthenticationService.permissions();
				vm.context		= $scope.context;
				vm.user			= AuthenticationService.user;

				function loadAffiliations() {
					try {
						vm.affiliations = OrgService.my();
					} catch (error) {
						Notification.error({message: error.message });
					}

				}

				vm.removeAffiliation = function(affiliation) {
					var question = 'Removing your affiliation with ' + affiliation.name + ' means they won\'t be able to include you on proposals to Sprint With Us opportunities. \
					Are you sure you want to do this?';
					ask.yesNo(question).then(function (result) {
						if (result) {
							OrgService.removeMeFromOrg ({
								orgId: affiliation._id
							}).$promise
							.then (function (org) {
								loadAffiliations();
								Notification.success({ message: '<i class="fas fa-check-circle"></i> You have been removed from ' + affiliation.name });
							});
						}
					});
				}

				loadAffiliations();
			}]
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
			template : '<button type="button" class="btn btn-sm btn-default" ng-click="wsx.edit()">Upload new picture</button>',
			controller: ['$scope', '$uibModal', function ($scope, $uibModal) {
				var wsx = this;
				var uploadurl = '/api/users/picture';
				if ($scope.org) {
					uploadurl = '/api/org/' + $scope.org._id + '/upload/logo'
				}
				wsx.edit = function () {
					$uibModal.open ({
						size: 'md',
						templateUrl: '/modules/users/client/views/settings/change-profile-modal.html',
						controllerAs: 'qqq',
						bindToController: true,
						controller: ['$state', '$timeout', 'AuthenticationService', '$uibModalInstance', 'Upload', 'Notification', function ($state, $timeout, authenticationService, $uibModalInstance, Upload, Notification) {
							var qqq = this;
							qqq.user = authenticationService.user;

							// -------------------------------------------------------------------------
							//
							// CC: BA-614-615 determine that the picture does not exceed the max allowed size
							//
							// -------------------------------------------------------------------------
							qqq.fileSelected = false;
							qqq.onSelectPicture = function (file) {
								if (!file) return;
								if (file.size > (1 * 1024 * 1024)) {
									Notification.error ({
										delay   : 6000,
										title   : '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x"></i> File Too Large</div>',
										message : '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
									});
								}
								else qqq.fileSelected = true;
							};

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
									qqq.progress = 100.0 * evt.loaded / evt.total;
								});
							};

							// Called after the user has successfully uploaded a new picture
							function onSuccessItem(response) {
								// Show success message
								Notification.success({ message: '<i class="fas fa-check-circle"></i> Change profile picture successful!' });
								// Populate user object
								qqq.user = authenticationService.user = response;
								// Reset form
								qqq.fileSelected = false;
								qqq.progress = 0;

								$state.reload();
							}

							// Called after the user has failed to uploaded a new picture
							function onErrorItem(response) {
								qqq.fileSelected = false;
								// Show error message
								Notification.error({ message: response.message, title: '<i class="fas fa-exclamation-triangle"></i> Change profile picture failed!' });
							}

							qqq.quitnow = function () { $uibModalInstance.dismiss('cancel'); }
						}]
					})
					;
				}
			}]
		};
	})
	;
}());
