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
			controller   : function ($scope, $sce, OrgsService, Authentication, Notification) {
				var vm = this;
				var isUser = Authentication.user;
				var isAdmin  = isUser && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = isUser && !!~Authentication.user.roles.indexOf ('gov');
				var uid      = isUser ? Authentication.user._id : 'none';
				vm.isAdmin = isAdmin;
				vm.isGov   = isGov;
				vm.userCanAdd = isUser && (isAdmin || !isGov);
				// console.log (isUser, isAdmin, isGov);
				vm.trust = $sce.trustAsHtml;
				$scope.orgs.forEach (function (org) {
					org.isOrgAdmin      = org.admins.map (function (u) { return (uid === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
					org.isOrgMember     = org.members.map (function (u) { return (uid === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
					org.isOrgOwner      = (uid === org.owner._id);
					org.canEdit         = vm.isAdmin || org.isOrgOwner || org.isOrgAdmin;
					// console.log ('org', org.name);
					// console.log ('uid', uid);
					// console.log ('owner', org.owner);
					// console.log ('admin', org.isOrgAdmin);
					// console.log ('member', org.isOrgMember);
					// console.log ('owner', org.isOrgOwner);
					// console.log ('canedit', org.canEdit);
				});
				vm.orgs = $scope.orgs;
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
			template : '<button class="btn btn-sm btn-success" ng-click="wsx.edit()">edit profile image</button>',
			controller: function ($rootScope, $scope, $uibModal, $timeout, Authentication, Upload, Notification) {
				var wsx = this;
				console.log (wsx);
				var uploadurl = '/api/upload/logo/org/'+wsx.org._id
				wsx.edit = function () {
					console.log ('what');
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
							qqq.upload = function (dataUrl, name) {
								Upload.upload({
									url: uploadurl,
									data: {
										orgImageURL: Upload.dataUrltoBlob(dataUrl, name)
									}
								}).then(function (response) {
									console.log (response);
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
