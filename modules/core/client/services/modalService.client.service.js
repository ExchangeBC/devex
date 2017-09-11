(function () {
	'use strict';

	angular.module('core')
	.service('modalService', ['$uibModal', function ($uibModal) {
		// inspired by this post :https://weblogs.asp.net/dwahlin/building-an-angularjs-modal-service
		var modalDefaults = {
			backdrop: true,
			keyboard: true,
			modalFade: true,
			templateUrl: '/modules/core/client/views/modalService.service.html'
		};

		var modalOptions = {
			closeButtonText: 'Close',
			actionButtonText: 'OK',
			headerText: null,
			bodyText: 'Perform this action?'
		};

		this.showModal = function (customModalDefaults, customModalOptions) {
			if (!customModalDefaults) customModalDefaults = {};
			customModalDefaults.backdrop = 'static';
			return this.show(customModalDefaults, customModalOptions);
		};

		this.show = function (customModalDefaults, customModalOptions) {
			// Create temp objects to work with since we're in a singleton service
			var tempModalDefaults = {};
			var tempModalOptions = {};

			// Map angular-ui modal custom defaults to modal defaults defined in service
			angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

			// Map modal.html $scope custom properties to defaults defined in service
			angular.extend(tempModalOptions, modalOptions, customModalOptions);

			if (!tempModalDefaults.controller) {
				tempModalDefaults.controller = function ($scope, $uibModalInstance) {
					$scope.modalOptions = tempModalOptions;
					$scope.modalOptions.ok = function (result) {
							$uibModalInstance.close(result);
					};
					$scope.modalOptions.close = function () {
							$uibModalInstance.dismiss('cancel');
					};
				};
			}

			return $uibModal.open(tempModalDefaults).result;
		};

	}])
	.service ('ask', ['modalService', function (modalService) {
		this.me = function (opts) {
			return new Promise (function (resolve) {
				modalService.showModal ({}, {
			        closeButtonText: opts.cancel || 'Cancel',
			        actionButtonText: opts.ok || 'OK',
			        headerText: opts.header || 'Continue ?',
			        bodyText: opts.question || 'Perform this action?'
				})
				.then (
					function () {
						resolve (true);
					},
					function () {
						resolve (false);
					}
				);
			});
		};
		this.okCancel = function (question, title) {
			return this.me ({
				question: question,
				cancel: 'Cancel',
				ok: 'OK',
				headerText: title
			});
		};
		this.yesNo = function (question, title) {
			return this.me ({
				question: question,
				cancel: 'No',
				ok: 'Yes',
				headerText: title
			});
		};
	}])

	;








}());
