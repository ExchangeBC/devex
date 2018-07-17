(function () {
	'use strict';
	angular.module ('orgs')
	// -------------------------------------------------------------------------
	//
	// directive for listing orgs
	//
	// -------------------------------------------------------------------------
	.directive ('orgList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				orgs: '='
			},
			templateUrl  : '/modules/orgs/client/views/list.orgs.directive.html',
			controller   : function ($scope, $sce, OrgsService, Authentication) {
				var vm = this;
				var isUser = Authentication.user;
				var isAdmin  = isUser && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = isUser && !!~Authentication.user.roles.indexOf ('gov');
				var uid      = isUser ? Authentication.user._id : 'none';
				vm.isAdmin = isAdmin;
				vm.isGov   = isGov;

				if (isUser) {
					OrgsService.myadmin ().$promise.then (function (orgs) {
						//
						// the user must be listed as the admin for at least one org.
						// for now, we only care about the first one, but in future they
						// may be able to be admins of multiple
						//
						var alreadyHasCompanies = isUser && (orgs && orgs.length > 0);

						vm.userCanAdd = isUser && !alreadyHasCompanies && (isAdmin || !isGov);
						vm.trust = $sce.trustAsHtml;
						$scope.orgs.forEach (function (org) {
							org.isOrgAdmin      = org.admins.map (function (u) { return (uid === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
							org.isOrgMember     = org.members.map (function (u) { return (uid === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
							org.isOrgOwner      = org.owner && (uid === org.owner._id);
							org.canEdit         = vm.isAdmin || org.isOrgOwner || org.isOrgAdmin;
						});
						vm.orgs = $scope.orgs;
					});
				}
				else {
					OrgsService.list().$promise.then(function (orgs) {
						vm.userCanAdd = false;
						vm.trust = $sce.trustAsHtml;
						vm.orgs = $scope.orgs;
					})
				}
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive, modal edit profile pic
	//
	// -------------------------------------------------------------------------
	.directive ('editOrgImage', function () {
		return {
			scope: {
				org: '='
			},
			controllerAs: 'wsx',
			bindToController: true,
			restrict: 'EAC',
			// replace: true,
			template : '<button class="btn btn-sm btn-default" ng-click="wsx.edit()">Update logo</button>',
			controller: function ($uibModal) {
				var wsx = this;
				var uploadurl = '/api/upload/logo/org/'+wsx.org._id
				wsx.edit = function () {
					$uibModal.open ({
						size: 'lg',
						templateUrl: '/modules/orgs/client/views/change-logo-modal.html',
						controllerAs: 'qqq',
						bindToController: true,
						resolve: {
							org: function () {
								return wsx.org;
							}
						},
						controller: function ($rootScope, $timeout, Authentication, org, $uibModalInstance, Upload, Notification) {
							var qqq = this;
							qqq.user = Authentication.user;
							qqq.fileSelected = false;
							qqq.org = org;
							qqq.org.orgImageURL = ((qqq.org.orgImageURL.substr(0,1) === '/' || qqq.org.orgImageURL.substr(0,4) === 'http') ? '' : '/') + qqq.org.orgImageURL;
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
										title   : '<div class="text-center"><i class="fa fa-exclamation-triangle fa-2x"></i> File Too Large</div>',
										message : '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
									});
								}
								else qqq.fileSelected = true;
							};
							qqq.upload = function (dataUrl, name) {
								Upload.upload({
									url: uploadurl,
									data: {
										orgImageURL: Upload.dataUrltoBlob(dataUrl, name)
									}
								}).then(function (response) {
									wsx.org.orgImageURL = response.data.orgImageURL;
									$rootScope.$broadcast('orgImageUpdated', response.data.orgImageURL);
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
								qqq.user = response;
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
					;
				}
			}
		};
	})
	;
}());
