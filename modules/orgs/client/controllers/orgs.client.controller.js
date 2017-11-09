(function () {
	'use strict';
	angular.module('orgs')
	// =========================================================================
	//
	// Controller for the master list of orgs
	//
	// =========================================================================
	.controller('OrgsListController', function (OrgsService) {
		var vm      = this;
		vm.orgs = OrgsService.query();
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
		vm.isOwner = false;
		vm.canEdit = vm.isAdmin || vm.isOwner;

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
		vm.add = function (isValid) {
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.orgaddForm');
				return false;
			}
			vm.org.createOrUpdate ()
			.then (function () {
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> Company saved successfully!'
				})
			})
			.then (function () {
				$state.go ('orgadmin.profile', {orgId:vm.org._id});
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
	})
	// =========================================================================
	//
	// edit the tonbstone info for an org
	//
	// =========================================================================
	.controller('OrgProfileController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
		var vm            = this;
		vm.user            = Authentication.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');

		vm.org        = org;
		if (!vm.org.capabilities) vm.org.capabilities = [];

		// vm.previousState  = previousState;
		// vm.editing        = editing;
		vm.cities         = dataService.cities;
		vm.capabilities   = dataService.capabilities;

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
		// -------------------------------------------------------------------------
		//
		// remove the program with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
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
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			console.log ('org', vm.org.capabilities);
			vm.form.orgForm.$setPristine ();
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
				vm.form.orgForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> org saved successfully!'
				});
				//
				// saved the record, now we can upload the logo if it was changed at all
				//
				((vm.fileSelected) ? vm.upload (vm.croppedDataUrl, vm.picFile, vm.org._id) : Promise.resolve ())
				.then (function () {
						$state.go('orgs.view', {orgId:vm.org._id});
				});
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
	// =========================================================================
	//
	// edit org skill list
	//
	// =========================================================================
	.controller('OrgAdminController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
	})
	// =========================================================================
	//
	// edit org skill list
	//
	// =========================================================================
	.controller('OrgTeamsController', function ($scope, $state, $sce, $window, $timeout, Upload, org, Authentication, Notification, dataService) {
	})
	;
}());
