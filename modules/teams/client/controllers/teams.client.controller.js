(function () {
	'use strict';
	angular.module('teams')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('TeamsListController', function (TeamsService) {
		var vm      = this;
		vm.teams = TeamsService.query();
	})
	// =========================================================================
	//
	// Controller the view of the team page
	//
	// =========================================================================
	.controller('TeamViewController', function ($scope, $state, $sce, $stateParams, team, Authentication, TeamsService, Notification) {
		var vm                 = this;
		vm.programId           = team.program ? team.program._id : $stateParams.programId;
		vm.team             = team;
		vm.display             = {};
		vm.display.description = $sce.trustAsHtml(vm.team.description);
		vm.authentication      = Authentication;
		vm.TeamsService     = TeamsService;
		vm.idString            = 'teamId';
		//
		// what can the user do here?
		//
		var isUser                 = Authentication.user;
		var isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov                  = isUser && !!~Authentication.user.roles.indexOf ('gov');
		var isMemberOrWaiting      = team.userIs.member || team.userIs.request;
		vm.isAdmin                 = isAdmin;
		vm.loggedIn                = isUser;
		vm.canRequestMembership    = isGov && !isMemberOrWaiting;
		vm.canEdit                 = isAdmin || team.userIs.admin;
		// -------------------------------------------------------------------------
		//
		// issue a request for membership
		//
		// -------------------------------------------------------------------------
		vm.request = function () {
			TeamsService.makeRequest({
				teamId: team._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
			});
		};
		// -------------------------------------------------------------------------
		//
		// publish or un publish the opportunity
		//
		// -------------------------------------------------------------------------
		vm.publish = function (state) {
			var publishedState = team.isPublished;
			var t = state ? 'Published' : 'Un-Published'
			team.isPublished = state;
			team.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> Team '+t+' Successfully!'
				});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				team.isPublished = publishedState;
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Team '+t+' Error!'
				});
			});
		};
	})
	// =========================================================================
	//
	// Controller the view of the team page
	//
	// =========================================================================
	.controller('TeamEditController', function ($scope, $state, $sce, $stateParams, $window, team, editing, programs, Authentication, Notification, previousState) {
		var vm             = this;
		vm.previousState   = previousState;
		vm.isAdmin         = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov           = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
		vm.isTeamAdmin  = (vm.editing) ? team.userIs.admin : true;
		vm.team         = team;
		vm.authentication  = Authentication;
		//
		// if the user doesn't have the right access then kick them out
		//
		if (editing && !vm.isAdmin && !team.userIs.admin) $state.go('forbidden');
		vm.form            = {};
		vm.team.taglist = vm.team.tags? vm.team.tags.join (', ') : '';
		vm.editing         = editing;
		vm.context         = $stateParams.context;
		vm.programs        = programs;
		vm.tinymceOptions  = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     :'',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		if (vm.programs.length === 0) {
			alert ('You do not have a program for which you are able to create a team. Please browse to or create a program to put the new team under.');
			$state.go (previousState.name, previousState.params);
		}
		//
		// if adding we care about the context
		// if editing, the program field is locked (and is just a link)
		// if adding then the user is restricted to add under a program they have
		// admin over. If adding wihin the context of a program then restrict to
		// that program only
		//
		//
		// defaults
		//
		vm.programLink  = true;
		vm.programId    = $stateParams.programId;
		vm.programTitle = $stateParams.programTitle;
		//
		// if editing, set from existing
		//
		if (vm.editing) {
			vm.programId    = team.program._id;
			vm.programTitle = team.program.title;
		} else {
			//
			// if adding with no program context display select box
			//
			if (vm.context === 'allteams') {
				vm.programLink = false;
			}
			//
			// if adding with program context set the program on the record
			//
			else if (vm.context === 'program') {
				vm.team.program = vm.programId;
			}
		}
		// -------------------------------------------------------------------------
		//
		// remove the team with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.team.$remove(function() {
					$state.go('teams.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> team deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the team, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			vm.form.teamForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.teamForm');
				return false;
			}
			if (vm.team.taglist !== '') {
				vm.team.tags = vm.team.taglist.split(/ *, */);
			} else {
				vm.team.tags = [];
			}
			//
			// if we were adding, then set the selected programId, unless it was adding inside
			// a program context already, then just use the one that is already set
			//
			if (!editing && vm.context === 'allteams') {
				vm.team.program = vm.programId;
			}
			//
			// Create a new team, or update the current instance
			//
			vm.team.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				vm.form.teamForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> team saved successfully!'
				});
				$state.go('teams.view', {teamId:team.code});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> team save error!'
				});
			});
		};
	})
	;
}());
