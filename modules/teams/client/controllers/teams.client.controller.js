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
	.controller('TeamEditController', function ($scope, $window, $state, $uibModalInstance, team, org, allusers, Authentication, Notification) {
		var qqq             = this;
		qqq.team         = team;
		if (!qqq.team.org) qqq.team.org = org._id;
		console.log (team);
		qqq.teamForm = {};
		if (!qqq.team.members) qqq.team.members = [];
		qqq.removals = [];
		qqq.additions = [];
		qqq.allusers = [];
		var availableusers = [];
		var pristine = angular.copy (qqq.team);
		qqq.people = [];
		var memberHash = qqq.team.members.reduce (function (accum, current) {accum[current._id] = current;return accum;}, {});
		var peopleHash = allusers.reduce (function (accum, current) {
			accum[current._id] = current;
			if (!memberHash[current._id]) qqq.allusers.push (current);
			return accum;
		}, {});
		console.log ('member hash', memberHash);
		console.log ('people hash', peopleHash);
		console.log ('allusers', qqq.allusers);
		console.log ('allusers', allusers);
		var removeElements = function (a, idlist) {
			var idx = idlist.reduce (function (accum, curr) {accum[curr] = true; return accum;}, {});
			return a.reduce (function (accum, curr) {
				if (!idx[curr._id]) accum.push (curr);
				return accum;
			}, [])
			.sort (function (a, b) {
				if (a.displayName < b.displayName) return -1;
				if (a.displayName > b.displayName) return 1;
				return 0;
			});
		};
		var addElements = function (a, idlist, pool) {
			return idlist.reduce (function (accum, curr) {
				accum.push (pool[curr]);
				return accum;
			}, a)
			.sort (function (a, b) {
				if (a.displayName < b.displayName) return -1;
				if (a.displayName > b.displayName) return 1;
				return 0;
			});
		};
		// -------------------------------------------------------------------------
		//
		// remove the team with some confirmation
		//
		// -------------------------------------------------------------------------
		qqq.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				qqq.team.$remove(function() {
					$state.go('teams.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> team deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// add or remove members
		//
		// -------------------------------------------------------------------------
		qqq.addPerson = function () {
			console.log ('add Person');
			if (qqq.additions.length) {
				qqq.team.members = addElements (qqq.team.members, qqq.additions, peopleHash);
				qqq.allusers = removeElements (qqq.allusers, qqq.additions);
				qqq.additions = [];
			}
		};
		qqq.remPerson = function () {
			console.log ('remove person');
			if (qqq.removals.length) {
				qqq.allusers = addElements (qqq.allusers, qqq.removals, peopleHash);
				qqq.team.members = removeElements (qqq.team.members, qqq.removals);
				qqq.removals = [];
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the team, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid) {
			qqq.teamForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'qqq.teamForm');
				return false;
			}
			//
			// Create a new team, or update the current instance
			//
			console.log ('qqq.team', qqq.team);
			qqq.team.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.teamForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> team saved successfully!'
				});
				$uibModalInstance.close (qqq.team);
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
		// -------------------------------------------------------------------------
		//
		// leave and set back to normal
		//
		// -------------------------------------------------------------------------
		qqq.quitnow = function () {
			team = pristine;
			$uibModalInstance.dismiss('cancel');
		};
	})
	;
}());
