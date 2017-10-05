(function () {
	'use strict';
	angular.module('profiles')
	// =========================================================================
	//
	// Controller for the master list of profiles
	//
	// =========================================================================
	.controller('ProfilesListController', function (ProfilesService) {
		var vm      = this;
		vm.profiles = ProfilesService.query();
	})
	// =========================================================================
	//
	// Controller the view of the profile page
	//
	// =========================================================================
	.controller('ProfileViewController', function ($scope, $state, $sce, profile, Authentication, ProfilesService, Notification) {
		var vm             = this;
		vm.profile         = profile;
		vm.description     = $sce.trustAsHtml(vm.profile.description);
		vm.authentication  = Authentication;
		vm.ProfilesService = ProfilesService;
		vm.idString        = 'profileId';
		//
		// what can the user do here?
		//
		vm.user            = Authentication.user;
		vm.isAdmin         = vm.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = vm.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.isOwner         = vm.user && vm.user._id === profile.user._id;
	})
	// =========================================================================
	//
	// Controller the view of the profile page
	//
	// =========================================================================
	.controller('ProfileEditController', function ($scope, $state, $sce, $window, $timeout, Upload, profile, editing, Authentication, Notification, previousState, dataService) {
		console.log ('controller loaded');
		var vm            = this;
		vm.form           = {};
		console.log ('profile:', editing, profile);
		vm.profile        = profile;
		if (editing && (!vm.profile || !vm.profile._id)) {
			console.log ('go to create');
			return $state.go('profileadmin.create');
		}
		vm.user           = Authentication.user;
		vm.previousState  = previousState;
		vm.isAdmin        = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov          = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.editing        = editing;
		vm.authentication = Authentication;
		vm.cities         = dataService.cities;
		vm.profile.skillist = vm.profile.skills ? vm.profile.skills.join (', ') : '';
		if (!editing) {
			vm.profile.user = Authentication.user;
		}
		//
		// if the user doesn't have the right access then kick them out
		//
		if (editing && vm.profile.user._id !== vm.user._id) $state.go('forbidden');
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
				vm.profile.$remove(function() {
					$state.go('profiles.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> profile deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the profile, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			console.log ('saving');
			this.save (true);
		};
		vm.save = function (isValid) {
			console.log ('saving');
			vm.form.profileForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.profileForm');
				return false;
			}
			vm.profile.skills = vm.profile.skillist.split(/ *, */);
			//
			// Create a new profile, or update the current instance
			//
			vm.profile.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				vm.form.profileForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> profile saved successfully!'
				});
				//
				// saved the record, now we can upload the logo if it was changed at all
				//
				((vm.fileSelected) ? vm.upload (vm.croppedDataUrl, vm.picFile, vm.profile._id) : Promise.resolve ())
				.then (function () {
						$state.go('profiles.view', {profileId:vm.profile._id});
				});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> profile save error!'
				});
			});
		};
		console.log ('vm', vm);
	})
	;
}());
