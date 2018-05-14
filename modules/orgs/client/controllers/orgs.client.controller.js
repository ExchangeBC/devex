(function () {
	'use strict';
	angular.module('orgs')
	// =========================================================================
	//
	// Controller for the master list of orgs
	//
	// =========================================================================
	.controller('OrgsListController', function (orgs, Authentication) {
		var vm      = this;
		vm.isLoggedIn      = !!Authentication.user;
		vm.orgs = orgs;
	})
	// =========================================================================
	//
	// Controller the view of the org page
	//
	// =========================================================================
	.controller('OrgViewController', function ($scope, $state, $sce, org, Authentication, OrgsService, Notification, capabilities) {
		var vm             = this;
		vm.org             = org;
		vm.user            = Authentication.user;
		// console.log ('user org admins' , vm.user.orgAdmin);
		// console.log (' org admins' , vm.org.admins);
		// console.log (' org owner' , vm.org.owner);
		vm.isLoggedIn      = !!vm.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.isOrgAdmin      = vm.user && vm.org.admins.map (function (u) { return (vm.user._id === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
		vm.isOrgOwner      = vm.user && org.owner && (vm.user._id === org.owner._id);
		vm.canEdit         = vm.isAdmin || vm.isOrgOwner || vm.isOrgAdmin;
		vm.trust           = $sce.trustAsHtml;

		vm.description     = $sce.trustAsHtml(vm.org.description);
		//
		// what can the user do here?
		//
	})
	// =========================================================================
	//
	// create a new org
	//
	// =========================================================================
	.controller('OrgCreateController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService, UsersService) {
		var vm = this;
		vm.features = window.features;
		vm.org = org;
		// vm.orgaddForm = {};
		vm.user = Authentication.user;
		var newId;
		vm.add = function (isValid) {
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.orgForm');
				return false;
			}
			vm.orgForm.$setPristine ();
			vm.org.createOrUpdate ()
			.then (function (result) {
				vm.orgForm.$setPristine ();
				newId = result._id;
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> Company saved successfully!'
				})
			})
			.then (function () {
				vm.user.orgsMember.push (newId);
				vm.user.orgsAdmin.push (newId);
				var user = new UsersService (vm.user);
				return new Promise (function (resolve, reject) {
					user.$update (function (response) {
						Authentication.user = response;
						resolve ();
					}, function (err) {
						reject (err);
					});
				});
				// UsersService.resetMe ();
			})
			.then (function () {
				$state.go ('orgadmin.profile', {orgId:newId});
			})
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Company save error!'
				});
			});
		}
		vm.delete = function () {
			$state.go('orgs.list');
		}
	})
	// =========================================================================
	//
	// top level of the edit
	//
	// =========================================================================
	.controller('OrgAdminController', function ($rootScope, org, OrgsService) {
		var vm = this;
		vm.org = org;
		$rootScope.$on('updateOrg', function () {
			OrgsService.get({orgId: org._id}).$promise.then (function (result) {
				vm.org = result;
			});
		});
	})
	// =========================================================================
	//
	// edit the tonbstone info for an org
	//
	// =========================================================================
	.controller('OrgProfileController', function ($rootScope, capabilities, $scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService, UsersService) {
		var vm            = this;
		vm.user            = Authentication.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');

		vm.org        = org;
		if (!vm.org.capabilities) vm.org.capabilities = [];

		// vm.previousState  = previousState;
		// vm.editing        = editing;
		vm.cities         = dataService.cities;
		vm.capabilities   = capabilities;

		// if (editing && (!vm.org || !vm.org._id)) {
		// 	return $state.go('orgadmin.create');
		// }

		vm.form           = {};
		vm.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     :'',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		$rootScope.$on('orgImageUpdated', function (evt, data) {
			vm.org.orgImageURL = data;

		});
		// -------------------------------------------------------------------------
		//
		// remove the org with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			var orgId = vm.org._id.toString ();
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.org.$remove(function() {
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> org deleted successfully!' });
					vm.user.orgsMember = vm.user.orgsMember.filter (function (el) {return el !== orgId;});
					vm.user.orgsAdmin  = vm.user.orgsAdmin.filter (function (el) {return el !== orgId;});
					var user = new UsersService (vm.user);
					user.$update (function (response) {
						Authentication.user = response;
						$state.go('orgs.list');
					});
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the org, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.save = function (isValid) {
			vm.orgForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.orgForm');
				return false;
			}
			//
			// Create a new org, or update the current instance
			//
			vm.org.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				vm.orgForm.$setPristine ();
				Notification.success ({
					message : '<i class="fa fa-3x fa-check-circle"></i><br> <h4>Changes saved</h4>'
				});
				// .then (function () {
				// 	$state.go('orgs.view', {orgId:vm.org._id});
				// });
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> org save error!'
				});
			});
		};
	})
	// -------------------------------------------------------------------------
	//
	// controller for skills
	//
	// -------------------------------------------------------------------------
	.controller('OrgSkillsController', function ($scope, capabilities, $sce, Notification, org, dataService, Authentication, UsersService) {
		var vm = this;
		vm.features = window.features;
		vm.org = org;
		vm.capabilities = capabilities;
		vm.updateUserProfile = function (isValid) {
			// vm.orgForm.$setPristine ();
			// if (!isValid) {
			// 	$scope.$broadcast('show-errors-check-validity', 'vm.form.orgForm');
			// 	return false;
			// }
			//
			// Create a new org, or update the current instance
			//
			vm.org.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				// vm.orgForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> capabilities saved successfully!'
				});
				// .then (function () {
				// 	$state.go('orgs.view', {orgId:vm.org._id});
				// });
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> capabilities save error!'
				});
			});
		}
	})
	// =========================================================================
	//
	// edit org teams list
	//
	// =========================================================================
	.controller('OrgTeamsController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm = this;
		vm.org = org;
		vm.features = window.features;
	})
	// =========================================================================
	//
	// edit org member list
	//
	// =========================================================================
	.controller('OrgMembersController', function ($scope, $rootScope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService, OrgsService, capabilities, CapabilitiesMethods, ask, modalService) {
		var vm = this;
		vm.org = org;
		vm.emaillist = '';
		CapabilitiesMethods.init (vm, vm.org, capabilities);
		// -------------------------------------------------------------------------
		//
		// refresh the organization and also the additions email list
		//
		// -------------------------------------------------------------------------
		vm.refresh = function () {
			$rootScope.$broadcast('updateOrg', 'done');
			vm.orgForm.$setPristine ();
			vm.emaillist = '';
			OrgsService.get ({orgId: vm.org._id}).$promise
			.then (function (org) {
				vm.org = org;
				CapabilitiesMethods.init (vm, vm.org, capabilities);
				$rootScope.$broadcast('updateOrg', 'done');
			});
		};
		// -------------------------------------------------------------------------
		//
		// add or remove members
		//
		// -------------------------------------------------------------------------
		vm.addMembers = function () {
			vm.orgForm.$setPristine ();
			if (vm.emaillist !== '') {
				vm.org.additions = vm.emaillist;
				vm.org.createOrUpdate ()
				.then (vm.displayResults)
				// .then (function () {
				// 	Notification.success ({
				// 		message : '<i class="glyphicon glyphicon-ok"></i> Member added and notified'
				// 	});
				// 	vm.refresh ();
				// })
				//
				// fail, notify and stay put
				//
				.then (function () {
					vm.emaillist = '';
					CapabilitiesMethods.init (vm, vm.org, capabilities);
					vm.refresh ();
					vm.orgForm.$setPristine ();
					$rootScope.$broadcast('updateOrg', 'done');
				})
				.catch (function (res) {
					Notification.error ({
						message : res.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> invitations send error!'
					});
				});
			}
		};
		vm.removeMember = function (member) {
			ask.yesNo ('Are you sure you want to remove this user from your company? If you have added them to a proposal, you may not longer qualify to apply on the opportunity.')
			.then (function (yes) {
				if (yes) {
					OrgsService.removeUser ({
						orgId: vm.org._id,
						userId: member._id
					}).$promise.then (function (org) {
						vm.refresh ();
					});
				}
			});
		};
		vm.save = function () {
			vm.orgForm.$setPristine ();
			vm.org.createOrUpdate ()
			.then (function () {
				vm.emaillist = '';
				CapabilitiesMethods.init (vm, vm.org, capabilities);
				vm.orgForm.$setPristine ();
				Notification.success ({
					message : '<i class="fa fa-3x fa-check-circle"></i><br> <h4>Congrats! Your company is now qualified for Sprint With Us.</h4>'
				});
				$rootScope.$broadcast('updateOrg', 'done');
			})
		};
		vm.displayResults = function (result) {
			if (!result.emaillist) return Promise.resolve ();
			return new Promise (function (resolve, reject) {
				modalService.showModal ({
					size: 'lg',
					templateUrl: '/modules/orgs/client/views/org-members-results.html',
					controller: function ($scope, $uibModalInstance) {
						$scope.data = {
							found    : result.emaillist.found,
							notfound : result.emaillist.notfound
						};
						$scope.close = function () {
							$uibModalInstance.close ();
						};
					}
				}, {
				})
				.then (resolve, reject);
			});
		};

	})
	// =========================================================================
	//
	// accept terms
	//
	// =========================================================================
	.controller('OrgTermsController', function ($rootScope, $state, org, Notification) {
		var vm = this;
		vm.org = org;
		vm.save = function () {
			vm.orgForm.$setPristine ();
			vm.org.createOrUpdate ()
			.then (function () {
				vm.orgForm.$setPristine ();
				Notification.success ({
					message : '<i class="fa fa-3x fa-check-circle"></i><br> <h4>Your company has accepted the terms of the RFQ.</h4>'
				});
				$rootScope.$broadcast('updateOrg', 'done');
			})
		};
	})
	// =========================================================================
	//
	// edit org skill list
	//
	// =========================================================================
	.controller('OrgProposalsController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm = this;
		vm.org = org;
	})
	;
}());
