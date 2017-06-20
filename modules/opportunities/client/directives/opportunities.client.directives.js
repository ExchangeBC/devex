(function () {
	'use strict';
	angular.module ('opportunities')
	// -------------------------------------------------------------------------
	//
	// directive for listing opportunities
	//
	// -------------------------------------------------------------------------
	.directive ('opportunityList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				project: '=',
				program: '=',
				title: '@',
				context: '@'
			},
			templateUrl  : '/modules/opportunities/client/views/list.opportunities.directive.html',
			controller   : function ($scope, OpportunitiesService, Authentication, Notification, modalService, $q, ask) {
				var rightNow = new Date ();
				var vm     = this;
				var isUser = Authentication.user;
				vm.isUser = isUser;
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
				vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
				vm.canApplyGeneral = isUser && !vm.isAdmin && !vm.isGov;
				vm.project = $scope.project;
				vm.program = $scope.program;
				vm.context = $scope.context;
				if (vm.context === 'project') {
					vm.programId    = vm.program._id;
					vm.programTitle = vm.program.title;
					vm.projectId    = vm.project._id;
					vm.projectTitle = vm.project.name;
					vm.title         = 'Opportunities for '+vm.projectTitle;
					vm.userCanAdd    = vm.project.userIs.admin || vm.isAdmin;
					vm.opportunities = OpportunitiesService.forProject ({
						projectId: vm.projectId
					});
					vm.columnCount   = 1;
				} else if (vm.context === 'program') {
					vm.programId    = vm.program._id;
					vm.programTitle = vm.program.title;
					vm.projectId    = null;
					vm.projectTitle = null;
					vm.title         = 'Opportunities for '+vm.programTitle;
					vm.userCanAdd    = (vm.isAdmin || vm.isGov);
					vm.opportunities = OpportunitiesService.forProgram ({
						programId: vm.programId
					});
					vm.columnCount   = 1;
				} else {
					vm.programId    = null;
					vm.programTitle = null;
					vm.projectId    = null;
					vm.projectTitle = null;
					vm.title         = 'All Opportunities';
					vm.userCanAdd    = (vm.isAdmin || vm.isGov);
					vm.opportunities = OpportunitiesService.query ();
					vm.columnCount   = 1;
				}
				if ($scope.title) vm.title = $scope.title;
				vm.publish = function (opportunity, state) {
					var publishedState      = opportunity.isPublished;
					var t = state ? 'Published' : 'Unpublished';

					var savemeSeymour = true;
					var promise = Promise.resolve ();
					if (state) {
						var question = opportunity.wasPublished ?
							'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?' :
							'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?';
						promise = ask.yesNo (question).then (function (result) {
							savemeSeymour = result;
						});
					}

						promise.then(function(r) {
							if (savemeSeymour) {
								opportunity.isPublished = state;
								if (state) return OpportunitiesService.publish ({opportunityId:opportunity._id}).$promise;
								else return OpportunitiesService.unpublish ({opportunityId:opportunity._id}).$promise;
							}
							else return Promise.reject ({data:{message:'Publish Cancelled'}});
						})
						.then (function (res) {


							//
							// success, notify
							//
							var m = state ? 'Your opportunity has been published and we\'ve notified subscribers!' : 'Your opportunity has been unpublished!'
							Notification.success ({
								message : '<i class="glyphicon glyphicon-ok"></i> '+m
							});
						})
						.catch (function (res) {
							//
							// fail, notify and stay put
							//
							opportunity.isPublished = publishedState;
							Notification.error ({
								message : res.data.message,
								title   : '<i class=\'glyphicon glyphicon-remove\'></i> Opportunity '+t+' Error!'
							});
						});
				};
				vm.request = function (opportunity) {
					OpportunitiesService.makeRequest({
						opportunityId: opportunity._id
					}).$promise.then (function () {
						opportunity.userIs.request = true;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Successfully Applied!' });
					})
					.catch (function (res) {
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Membership Request Error!'
						});
					});
				};
				vm.closing = function (opportunity) {
					var ret = 'CLOSED';
					var d = (new Date(opportunity.deadline)) - rightNow;
					if (d > 0) {
						var dd = Math.floor(d / 86400000); // days
						var dh = Math.floor((d % 86400000) / 3600000); // hours
						var dm = Math.round(((d % 86400000) % 3600000) / 60000); // minutes
						ret = dm+' minutes';
						if (dd > 0) ret = dd+' days '+dh+' hours '+dm+' minutes';
						else if (dh > 0) ret = dh+' hours '+dm+' minutes';
						else ret = dm+' minutes';
					}
					return ret;
				};
			}
		}
	})
	;
}());
