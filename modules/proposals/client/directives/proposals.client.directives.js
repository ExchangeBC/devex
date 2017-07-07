(function () {
	'use strict';
	angular.module ('proposals')
	// -------------------------------------------------------------------------
	//
	// directive for the button to apply, edit, or review proposal
	//
	// -------------------------------------------------------------------------
	.directive ('proposalApply', function () {
		return {
			restrict     : 'E',
			controllerAs : 'qaz',
			templateUrl  : '/modules/proposals/client/views/proposal-apply.directive2.html',
			scope        : {
				opportunity: '=',
				proposal: '='
			},
			bindToController: true,
			controller   : function ($scope, ProposalsService, Authentication, Notification) {
				var qaz = this;
				// console.log ('qaz.proposal', qaz.proposal);
				//
				// we need to determine which of several possibilities we have
				//
				// - not logged in <please log in>
				// - logged in as gov user (not opportunity admin) <nothing>
				// - logged in as apportunity admin (or admin) <nothing>
				// - logged in as user NOT gov
				//   - proposal Id : edit
				//   - no proposal id: create
				//
				var isUser            = Authentication.user;
				var isAdmin           = isUser && !!~Authentication.user.roles.indexOf ('admin');
				var isGov             = isUser && !!~Authentication.user.roles.indexOf ('gov');
				var isOppAdmin        = isUser && qaz.opportunity.userIs.admin;
				var isMemberOrWaiting = isUser && (qaz.opportunity.userIs.member || qaz.opportunity.userIs.request);
				var isProposal        = qaz.proposal && qaz.proposal._id;
				// var isOppAdmin        = isUser && $scope.opportunity.userIs.admin;
				// var isMemberOrWaiting = isUser && ($scope.opportunity.userIs.member || $scope.opportunity.userIs.request);
				// var isProposal        = $scope.proposal && $scope.proposal._id;
				var canedit           = !(isAdmin || isGov || isMemberOrWaiting);
				qaz.case               = 'nothing';
				if (!isUser) qaz.case = 'guest';
				else if (canedit) qaz.case = isProposal ? 'canedit' : 'canadd';
				// qaz.opportunity = $scope.opportunity;
				// qaz.proposal    = $scope.proposal;
			}
		};
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing proposals
	//
	// -------------------------------------------------------------------------
	.directive ('proposalList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				program: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/proposals/client/views/list.proposals.directive.html',
			controller   : function ($scope, ProposalsService, Authentication, Notification) {
				var vm     = this;
				vm.program = $scope.program;
				vm.context = $scope.context;
				var isUser = Authentication.user;
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
				vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
				if (vm.context === 'program') {
					vm.programId = vm.program._id;
					vm.programTitle = vm.program.title;
				} else {
					vm.programId = null;
					vm.programTitle = null;
				}
				//
				// if a program is supplied, then only list proposals under it
				// also allow adding a new proposal (because it has context)
				//
				if ($scope.program) {
					vm.title      = 'Proposals for '+$scope.program.title;
					vm.programId  = $scope.program._id;
					vm.userCanAdd = $scope.program.userIs.admin || vm.isAdmin;
					vm.proposals   = ProposalsService.forProgram ({
						programId: $scope.program._id
					});
					vm.columnCount = 1;
				} else {
					vm.title      = 'All Proposals';
					vm.programId  = null;
					vm.userCanAdd = (vm.isAdmin || vm.isGov);
					vm.proposals   = ProposalsService.query ();
					vm.columnCount = 1;
				}
				if ($scope.title) vm.title = $scope.title;
				vm.publish = function (proposal, state) {
					var publishedState = proposal.isPublished;
					var t = state ? 'Published' : 'Un-Published'
					proposal.isPublished = state;
					proposal.createOrUpdate ()
					//
					// success, notify and return to list
					//
					.then (function (res) {
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> Proposal '+t+' Successfully!'
						});
					})
					//
					// fail, notify and stay put
					//
					.catch (function (res) {
						proposal.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Proposal '+t+' Error!'
						});
					});
				};
				vm.request = function (proposal) {
					ProposalsService.makeRequest ({
						proposalId: proposal._id
					}).$promise
					.then (function () {
						proposal.userIs.request = true;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
					})
					.catch (function (res) {
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Membership Request Error!'
						});
					});
				};
			}
		}
	})
	;
}());
