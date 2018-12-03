(function() {
	'use strict';
	angular
		.module('opportunities')
		// -------------------------------------------------------------------------
		//
		// directive for selecting an entire input box on click
		//
		// -------------------------------------------------------------------------
		.directive('selectOnClick', [
			'$window',
			function($window) {
				return {
					restrict: 'A',
					link: function(scope, element, attrs) {
						element.on('focus', function() {
							this.select();
						});
					}
				};
			}
		])
		// -------------------------------------------------------------------------
		//
		// directive for displaying a card for a single opportunity
		//
		// -------------------------------------------------------------------------
		.directive('opportunityCard', [
			'$state',
			function($state) {
				return {
					restrict: 'E',
					controllerAs: 'vm',
					scope: {
						opportunity: '='
					},
					templateUrl: '/modules/opportunities/client/views/opportunity-card-directive.html',
					controller: [
						'Authentication',
						'OpportunitiesCommon',
						'OpportunitiesService',
						'ask',
						'Notification',
						function(Authentication, OpportunitiesCommon, OpportunitiesService, ask, Notification) {
							var vm = this;
							vm.isUser = Authentication.user;
							vm.isAdmin = vm.isUser && !!~Authentication.user.roles.indexOf('admin');

							vm.publish = function(opportunity, state) {
								var publishedState = opportunity.isPublished;
								var t = state ? 'Published' : 'Unpublished';
								var savemeSeymour = true;
								var promise = Promise.resolve();
								if (state) {
									var question =
										'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?';
									promise = ask.yesNo(question).then(function(result) {
										savemeSeymour = result;
									});
								}
								promise
									.then(function() {
										if (savemeSeymour) {
											opportunity.isPublished = state;
											if (state)
												return OpportunitiesService.publish({ opportunityId: opportunity._id })
													.$promise;
											else
												return OpportunitiesService.unpublish({
													opportunityId: opportunity._id
												}).$promise;
										} else return Promise.reject({ data: { message: 'Publish Cancelled' } });
									})
									.then(function() {
										//
										// success, notify
										//
										var m = state
											? 'Your opportunity has been published and we\'ve notified subscribers!'
											: 'Your opportunity has been unpublished!';
										Notification.success({
											message: '<i class="fas fa-check-circle"></i> ' + m
										});
									})
									.catch(function(res) {
										//
										// fail, notify and stay put
										//
										opportunity.isPublished = publishedState;
										Notification.error({
											message: res.data.message,
											title:
												'<i class=\'fas fa-exclamation-triangle\'></i> Opportunity ' +
												t +
												' Error!'
										});
									});
							};

							vm.isWatching = function(opportunity) {
								return OpportunitiesCommon.isWatching(opportunity);
							};

							vm.toggleWatch = function(opp) {
								if (vm.isWatching(opp)) {
									opp.isWatching = OpportunitiesCommon.removeWatch(opp);
								} else {
									opp.isWatching = OpportunitiesCommon.addWatch(opp);
								}
							};

							vm.goToView = function(opportunity) {
								if (opportunity.opportunityTypeCd === 'code-with-us') {
									$state.go('opportunities.viewcwu', {
										opportunityId: opportunity.code
									});
								} else {
									$state.go('opportunities.viewswu', {
										opportunityId: opportunity.code
									});
								}
							};

							vm.goToEditView = function(opportunity) {
								if (opportunity.opportunityTypeCd === 'code-with-us') {
									$state.go('opportunityadmin.editcwu', {
										opportunityId: opportunity.code
									});
								} else {
									$state.go('opportunityadmin.editswu', {
										opportunityId: opportunity.code
									});
								}
							};

							vm.closing = function(opportunity) {
								var ret = 'CLOSED';
								var dateDiff = new Date(opportunity.deadline) - new Date();
								if (dateDiff > 0) {
									var dd = Math.floor(dateDiff / 86400000); // days
									var dh = Math.floor((dateDiff % 86400000) / 3600000); // hours
									var dm = Math.round(((dateDiff % 86400000) % 3600000) / 60000); // minutes
									if (dd > 0) ret = dd + ' days ' + dh + ' hours ' + dm + ' minutes';
									else if (dh > 0) ret = dh + ' hours ' + dm + ' minutes';
									else ret = dm + ' minutes';
								}
								return ret;
							};
						}
					]
				};
			}
		])
		// -------------------------------------------------------------------------
		//
		// directive for displaying a list of opportunities
		//
		// -------------------------------------------------------------------------
		.directive('opportunityList', [
			'$state',
			function($state) {
				return {
					restrict: 'E',
					controllerAs: 'vm',
					scope: {
						project: '=',
						program: '=',
						title: '@',
						context: '@'
					},
					templateUrl: '/modules/opportunities/client/views/opportunity-list-directive.html',
					controller: [
						'$scope',
						'OpportunitiesService',
						'Authentication',
						'Notification',
						'UsersService',
						function($scope, OpportunitiesService, Authentication, Notification, UsersService) {
							var vm = this;

							vm.rightNow = new Date();
							vm.isUser = Authentication.user;
							vm.user = vm.isUser;
							vm.isAdmin = vm.isUser && !!~Authentication.user.roles.indexOf('admin');
							vm.isGov = vm.isUser && !!~Authentication.user.roles.indexOf('gov');
							vm.isLoading = true;
							vm.userCanAdd = vm.isUser && (vm.isGov || vm.isAdmin);

							OpportunitiesService.query().$promise.then(function(opps) {
								vm.opportunities = opps;
								vm.isLoading = false;
							});

							vm.filterRecords = function(r, i, a) {
								var d = new Date(r.deadline);
								var result =
									((vm.filter.sprint && r.opportunityTypeCd === 'sprint-with-us') ||
										(vm.filter.code && r.opportunityTypeCd === 'code-with-us')) &&
									((vm.filter.open && vm.rightNow < d) || (vm.filter.closed && vm.rightNow >= d));
								return result;
							};

							vm.filterOpen = function(r) {
								var d = new Date(r.deadline);
								return vm.rightNow <= d;
							};

							vm.filterClosed = function(r) {
								var d = new Date(r.deadline);
								return vm.rightNow > d;
							};

							vm.countOpenOpportunities = function() {
								return vm.opportunities.filter(function(opportunity) {
									return vm.rightNow <= new Date(opportunity.deadline);
								}).length;
							};

							vm.getTotalClosedAmount = function() {
								var total = 0;
								vm.opportunities
									.filter(function(opportunity) {
										return vm.rightNow > new Date(opportunity.deadline);
									})
									.forEach(function(closedOpportunity) {
										if (closedOpportunity.opportunityTypeCd === 'code-with-us') {
											total += closedOpportunity.earn;
										} else {
											total += closedOpportunity.budget;
										}
									});

								return total;
							};

							vm.toggleSubscription = function() {
								if (!Authentication.user) {
									return;
								}

								Authentication.user.notifyOpportunities = !Authentication.user.notifyOpportunities;
								var user = new UsersService(Authentication.user);
								var message;
								if (Authentication.user.notifyOpportunities) {
									message =
										'<i class="fas fa-bell fa-3x"></i><br/><br/>You will be notified of new Opportunities';
								} else {
									message =
										'<i class="fas fa-bell-slash fa-3x"></i><br/><br/>You will no longer be notified of new Opportunities';
								}

								Notification.success({
									message: message
								});
							};
						}
					]
				};
			}
		]);
}());
