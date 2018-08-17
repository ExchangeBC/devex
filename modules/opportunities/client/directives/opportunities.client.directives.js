(function () {
	'use strict';
	angular.module ('opportunities')
	.directive('selectOnClick', ['$window', function ($window) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				element.on('focus', function () {
					this.select();
				});
			}
		};
	}])
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
			templateUrl  : '/modules/opportunities/client/views/opportunity-list-directive.html',
			controller   : function ($scope, OpportunitiesService, OpportunitiesCommon, Authentication, Notification, modalService, $q, ask, UsersService) {
				var rightNow = new Date ();
				var vm     = this;
				// vm.features = window.features;
				vm.rightNow = rightNow;
				vm.rightNowString = vm.rightNow.toString();
				var isUser = Authentication.user;
				vm.isUser = isUser;
				vm.user = isUser;
				vm.isAdmin = isUser && !!~Authentication.user.roles.indexOf ('admin');
				vm.isGov   = isUser && !!~Authentication.user.roles.indexOf ('gov');
				vm.canApplyGeneral = isUser && !vm.isAdmin && !vm.isGov;
				vm.project = $scope.project;
				vm.program = $scope.program;
				vm.context = $scope.context;
				vm.isLoading = true;
				if (vm.context === 'project') {
					vm.programId    = vm.program._id;
					vm.programTitle = vm.program.title;
					vm.projectId    = vm.project._id;
					vm.projectTitle = vm.project.name;
					vm.title         = 'Opportunities for '+vm.projectTitle;
					vm.userCanAdd    = vm.project.userIs.admin || vm.isAdmin;
					OpportunitiesService.forProject ({
						projectId: vm.projectId
					}).$promise.then (function (opps) {vm.opportunities = opps; vm.isLoading = false;});
					vm.columnCount   = 1;
				} else if (vm.context === 'program') {
					vm.programId    = vm.program._id;
					vm.programTitle = vm.program.title;
					vm.projectId    = null;
					vm.projectTitle = null;
					vm.title         = 'Opportunities for '+vm.programTitle;
					vm.userCanAdd    = (vm.isAdmin || vm.isGov);
					OpportunitiesService.forProgram ({
						programId: vm.programId
					}).$promise.then (function (opps) {vm.opportunities = opps; vm.isLoading = false;});
					vm.columnCount   = 1;
				} else {
					vm.programId    = null;
					vm.programTitle = null;
					vm.projectId    = null;
					vm.projectTitle = null;
					vm.title         = 'All Opportunities';
					vm.userCanAdd    = (vm.isAdmin || vm.isGov);
					OpportunitiesService.query ().$promise.then (function (opps) {vm.opportunities = opps; vm.isLoading = false;});
					vm.columnCount   = 1;
				}
				if ($scope.title) vm.title = $scope.title;
				if (!window.opportunityFilter) {
					window.opportunityFilter = {
						sprint: true,
						code: true,
						open: true,
						closed: false
					};
				}
				vm.filter = window.opportunityFilter;
				vm.filterRecords = function (r, i, a) {
					var d = new Date (r.deadline);
					var result = (
						(vm.filter.sprint && r.opportunityTypeCd === 'sprint-with-us') ||
						(vm.filter.code && r.opportunityTypeCd === 'code-with-us')
					) && (
						(vm.filter.open && vm.rightNow < d) ||
						(vm.filter.closed && vm.rightNow >= d)
					);
					return result;
				};
				vm.filterOpen = function(r) {
					var d = new Date (r.deadline);
					return vm.rightNow <= d;
				}
				vm.filterClosed = function(r) {
					var d = new Date (r.deadline);
					return vm.rightNow > d;
				};
				vm.countOpenOpportunities = function() {
					return vm.opportunities.filter(function(opportunity) {
						return vm.rightNow <= new Date(opportunity.deadline);
					}).length;
				}
				/**
				 * Returns the total value of all closed opportunities.
				 * Sums up earnings for CWU and budget for SWU
				 */
				vm.getTotalClosedAmount = function() {

					var total = 0;
					vm.opportunities
					.filter(function(opportunity) {
						return vm.rightNow > new Date(opportunity.deadline);
					})
					.forEach(function(closedOpportunity) {
						if (closedOpportunity.opportunityTypeCd === 'code-with-us') {
							total += closedOpportunity.earn;
						}
						else {
							total += closedOpportunity.budget;
						}
					});

					return total;
				};
				vm.publish = function (opportunity, state) {
					var publishedState = opportunity.isPublished;
					var t              = state ? 'Published' : 'Unpublished';
					var savemeSeymour  = true;
					var promise = Promise.resolve ();
					if (state) {
						var question = 'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?';
						promise = ask.yesNo (question).then (function (result) {
							savemeSeymour = result;
						});
					}
					promise.then(function() {
						if (savemeSeymour) {
							opportunity.isPublished = state;
							if (state) return OpportunitiesService.publish ({opportunityId:opportunity._id}).$promise;
							else return OpportunitiesService.unpublish ({opportunityId:opportunity._id}).$promise;
						}
						else return Promise.reject ({data:{message:'Publish Cancelled'}});
					})
					.then (function () {
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
						if (dd > 0) ret = dd+' days '+dh+' hours '+dm+' minutes';
						else if (dh > 0) ret = dh+' hours '+dm+' minutes';
						else ret = dm+' minutes';
					}
					return ret;
				};
				vm.isWatching = function (opportunity) {
					return OpportunitiesCommon.isWatchng (opportunity);
				};
				vm.addWatch    = function (opp) {opp.isWatching = OpportunitiesCommon.addWatch (opp);};
				vm.removeWatch = function (opp) {opp.isWatching = OpportunitiesCommon.removeWatch (opp);};

				vm.subscribe   = function () {
					if (!Authentication.user) return;
					Authentication.user.notifyOpportunities = true;
					var user = new UsersService(Authentication.user);
					user.$update ();
					Notification.success ({ message: '<i class="fa fa-bell fa-3x"></i><br/><br/>You will be notified of new Opportunities' });
					return true;
				};
				vm.unsubscribe = function () {
					if (!Authentication.user) return;
					Authentication.user.notifyOpportunities = false;
					var user = new UsersService(Authentication.user);
					user.$update ();
					Notification.success ({ message: '<i class="fa fa-bell-slash fa-3x"></i><br/><br/>You will no longer be notified of new Opportunities' });
					return false;
				};
			}
		}
	})
	;
}());
