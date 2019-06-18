(() => {
	'use strict';

	angular
		.module('core')
		.service('modalService', [
			'$uibModal',
			function($uibModal) {
				// inspired by this post :https://weblogs.asp.net/dwahlin/building-an-angularjs-modal-service
				const modalDefaults = {
					size: 'sm',
					backdrop: true,
					keyboard: true,
					modalFade: true,
					templateUrl:
						'/modules/core/client/views/modalService.service.html'
				};

				const modalOptions = {
					closeButtonText: 'Close',
					actionButtonText: 'OK',
					headerText: null,
					bodyText: 'Perform this action?'
				};

				this.showModal = function(
					customModalDefaults,
					customModalOptions
				) {
					if (!customModalDefaults) {
						customModalDefaults = {};
					}
					customModalDefaults.backdrop = 'static';
					return this.show(customModalDefaults, customModalOptions);
				};

				this.show = (customModalDefaults, customModalOptions) => {
					// Create temp objects to work with since we're in a singleton service
					const tempModalDefaults: any = {};
					const tempModalOptions: any = {};

					// Map angular-ui modal custom defaults to modal defaults defined in service
					angular.extend(
						tempModalDefaults,
						modalDefaults,
						customModalDefaults
					);

					// Map modal.html $scope custom properties to defaults defined in service
					angular.extend(
						tempModalOptions,
						modalOptions,
						customModalOptions
					);

					if (!tempModalDefaults.controller) {
						tempModalDefaults.controller = [
							'$scope',
							'$uibModalInstance',
							($scope, $uibModalInstance) => {
								$scope.modalOptions = tempModalOptions;
								$scope.modalOptions.ok = result => {
									$uibModalInstance.close(result);
								};
								$scope.modalOptions.close = () => {
									$uibModalInstance.dismiss('cancel');
								};
							}
						];
					}

					return $uibModal.open(tempModalDefaults).result;
				};
			}
		])
		.service('ask', [
			'modalService',
			function(modalService) {
				this.me = opts => {
					return new Promise(resolve => {
						modalService
							.showModal(
								{},
								{
									closeButtonText: opts.cancel || 'Cancel',
									actionButtonText: opts.ok || 'OK',
									headerText: opts.header || 'Are you sure?',
									bodyText:
										opts.question || 'Perform this action?'
								}
							)
							.then(
								() => {
									resolve(true);
								},
								() => {
									resolve(false);
								}
							);
					});
				};
				this.yesNo = function(question, title) {
					return this.me({
						question,
						cancel: 'No',
						ok: 'Yes',
						headerText: title
					});
				};
			}
		]);
})();
