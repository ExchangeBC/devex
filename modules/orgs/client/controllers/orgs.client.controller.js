(function () {
	'use strict';
	angular.module('orgs')
	// =========================================================================
	//
	// Controller for the master list of orgs
	//
	// =========================================================================
	.controller('OrgsListController', function (orgs) {
		var vm      = this;
		vm.orgs = orgs;
	})
	// =========================================================================
	//
	// Controller the view of the org page
	//
	// =========================================================================
	.controller('OrgViewController', function ($scope, $state, $sce, org, Authentication, OrgsService, Notification) {
		var vm             = this;
		vm.org             = org;
		vm.user            = Authentication.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.isOrgAdmin      = vm.org.admins.map (function (u) { return (vm.user._id === u._id); }).reduce (function (accum, curr) {return (accum || curr);}, false);
		vm.isOrgOwner      = (vm.user._id === org.owner._id);
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
	.controller('OrgCreateController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm = this;
		vm.features = window.features;
		vm.org = org;
		// vm.orgaddForm = {};
		var isUser           = Authentication.user;
		var newId;
		vm.add = function (isValid) {
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.orgaddForm');
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
	.controller('OrgAdminController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm = this;
		vm.org = org;
	})
	// =========================================================================
	//
	// edit the tonbstone info for an org
	//
	// =========================================================================
	.controller('OrgProfileController', function ($rootScope, capabilities, $scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm            = this;
		vm.user            = Authentication.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');

		vm.org        = org;
		console.log (org);
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
			console.log ('event data = ', data);
			vm.org.orgImageURL = data;

		});
		// -------------------------------------------------------------------------
		//
		// remove the program with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				console.log ('deleting');
				vm.org.$remove(function() {
					$state.go('orgs.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> org deleted successfully!' });
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
					message : '<i class="glyphicon glyphicon-ok"></i> org saved successfully!'
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
		vm.capabilities     = capabilities;
		vm.updateUserProfile = function (isValid) {
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
	.controller('OrgMembersController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService, OrgsService) {
		var vm = this;
		vm.org = org;
		vm.emaillist = '';
		// -------------------------------------------------------------------------
		//
		// refresh the organization and also the additions email list
		//
		// -------------------------------------------------------------------------
		vm.refresh = function () {
			vm.emaillist = '';
			OrgsService.get ({orgId: vm.org._id}).$promise
			.then (function (org) {
				vm.org = org;
			});
		};
		// -------------------------------------------------------------------------
		//
		// add or remove members
		//
		// -------------------------------------------------------------------------
		vm.addMembers = function () {
			console.log ('add People');
			if (vm.emaillist !== '') {
				vm.org.additions = vm.emaillist;
				vm.org.createOrUpdate ()
				.then (function () {
					Notification.success ({
						message : '<i class="glyphicon glyphicon-ok"></i> invitations sent successfully!'
					});
					vm.refresh ();
				})
				//
				// fail, notify and stay put
				//
				.catch (function (res) {
					Notification.error ({
						message : res.data.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> invitations send error!'
					});
				});
			}
		};
		vm.removeMember = function (member) {
			console.log ('remove person');
			OrgsService.removeUser ({
				orgId: vm.org._id,
				userId: member._id
			}).$promise.then (function (org) {
				vm.refresh ();
			});
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
