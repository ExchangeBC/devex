'use strict';

import angular from 'angular';

(() => {
	const formatDate = date => {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = date.getDate();
		const monthIndex = date.getMonth();
		const year = date.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', ' + year;
	};

	angular
		.module('opportunities')

		// Controller the view of the SWU opportunity page
		.controller('OpportunityViewSWUController', [
			'$state',
			'$stateParams',
			'$sce',
			'org',
			'opportunity',
			'Authentication',
			'OpportunitiesService',
			'Notification',
			'ask',
			'myproposal',
			'OpportunitiesCommon',
			function($state, $stateParams, $sce, org, opportunity, Authentication, OpportunitiesService, Notification, ask, myproposal, OpportunitiesCommon) {
				if (!opportunity) {
					$state.go('opportunities.list');
				}
				const vm = this;
				vm.myproposal = myproposal;
				vm.projectId = $stateParams.projectId;
				vm.opportunity = opportunity;
				vm.pageViews = opportunity.views;
				vm.opportunity.deadline = new Date(vm.opportunity.deadline);
				vm.opportunity.assignment = new Date(vm.opportunity.assignment);
				vm.opportunity.start = new Date(vm.opportunity.start);
				vm.opportunity.endDate = new Date(vm.opportunity.endDate);
				vm.org = org;

				vm.opportunity.phases.inception.startDate = new Date(vm.opportunity.phases.inception.startDate);
				vm.opportunity.phases.inception.endDate = new Date(vm.opportunity.phases.inception.endDate);
				vm.opportunity.phases.proto.startDate = new Date(vm.opportunity.phases.proto.startDate);
				vm.opportunity.phases.proto.endDate = new Date(vm.opportunity.phases.proto.endDate);
				vm.opportunity.phases.implementation.startDate = new Date(vm.opportunity.phases.implementation.startDate);
				vm.opportunity.phases.implementation.endDate = new Date(vm.opportunity.phases.implementation.endDate);

				vm.opportunity.phases.inception.fstartDate = formatDate(vm.opportunity.phases.inception.startDate);
				vm.opportunity.phases.inception.fendDate = formatDate(vm.opportunity.phases.inception.endDate);
				vm.opportunity.phases.proto.fstartDate = formatDate(vm.opportunity.phases.proto.startDate);
				vm.opportunity.phases.proto.fendDate = formatDate(vm.opportunity.phases.proto.endDate);
				vm.opportunity.phases.implementation.fstartDate = formatDate(vm.opportunity.phases.implementation.startDate);
				vm.opportunity.phases.implementation.fendDate = formatDate(vm.opportunity.phases.implementation.endDate);

				vm.authentication = Authentication;
				vm.OpportunitiesService = OpportunitiesService;
				vm.idString = 'opportunityId';
				vm.display = {};
				vm.display.description = $sce.trustAsHtml(vm.opportunity.description);
				vm.display.evaluation = $sce.trustAsHtml(vm.opportunity.evaluation);
				vm.display.criteria = $sce.trustAsHtml(vm.opportunity.criteria);
				vm.display.addenda = vm.opportunity.addenda;
				vm.display.addenda.forEach(addendum => {
					addendum.cleanDesc = $sce.trustAsHtml(addendum.description);
				});
				vm.trust = $sce.trustAsHtml;
				vm.canApply = org && org.metRFQ;
				vm.opportunity.hasOrg = vm.canApply;
				vm.numberOfInterviews = vm.opportunity.numberOfInterviews;

				// Set up capabilities and capability skills
				vm.capabilitySkills = OpportunitiesCommon.getTechnicalSkills(opportunity);
				vm.inceptionCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.inception);
				vm.prototypeCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.proto);
				vm.implementationCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.implementation);

				vm.isWatching = OpportunitiesCommon.isWatching(vm.opportunity);
				vm.toggleWatch = () => {
					if (vm.isWatching) {
						vm.removeWatch();
					} else {
						vm.addWatch();
					}
				};
				vm.addWatch = () => {
					vm.isWatching = OpportunitiesCommon.addWatch(vm.opportunity);
				};
				vm.removeWatch = () => {
					vm.isWatching = OpportunitiesCommon.removeWatch(vm.opportunity);
				};
				//
				// what can the user do here?
				//
				const isUser = Authentication.user;
				const isAdmin = isUser && Authentication.user.roles.indexOf('admin') !== -1;
				const isGov = isUser && Authentication.user.roles.indexOf('gov') !== -1;
				vm.isGov = isGov;
				vm.hasEmail = isUser && Authentication.user.email !== '';
				const isMemberOrWaiting = opportunity.userIs.member || opportunity.userIs.request;
				vm.loggedIn = !!isUser;
				vm.canRequestMembership = isGov && !isMemberOrWaiting;
				vm.canEdit = isAdmin || opportunity.userIs.admin;
				vm.isMember = opportunity.userIs.member;
				vm.isSprintWithUs = vm.opportunity.opportunityTypeCd === 'sprint-with-us';
				vm.showProposals = vm.canEdit && vm.opportunity.isPublished;
				vm.isAdmin = isAdmin;
				//
				// dates
				//
				const rightNow = new Date();
				vm.closing = 'CLOSED';
				const timeDiff = vm.opportunity.deadline - rightNow.getTime();
				if (timeDiff > 0) {
					const dd = Math.floor(timeDiff / 86400000); // days
					const dh = Math.floor((timeDiff % 86400000) / 3600000); // hours
					const dm = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
					vm.closing = dm + ' minutes';
					if (dd > 0) {
						vm.closing = dd + ' days ' + dh + ' hours ' + dm + ' minutes';
					} else if (dh > 0) {
						vm.closing = dh + ' hours ' + dm + ' minutes';
					} else {
						vm.closing = dm + ' minutes';
					}
				}
				const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
				const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				let dt = vm.opportunity.deadline;
				vm.deadline = dt.getHours() + ':00 Pacific Time, ' + dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
				dt = vm.opportunity.assignment;
				vm.assignment = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
				dt = vm.opportunity.start;
				vm.start = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
				// -------------------------------------------------------------------------
				//
				// can this be published?
				//
				// -------------------------------------------------------------------------
				vm.errorFields = OpportunitiesCommon.publishStatus(vm.opportunity);
				vm.canPublish = vm.errorFields.length === 0;
				// -------------------------------------------------------------------------
				//
				// issue a request for membership
				//
				// -------------------------------------------------------------------------
				vm.request = () => {
					OpportunitiesService.makeRequest({
						opportunityId: opportunity._id
					}).$promise.then(() => {
						Notification.success({ message: '<i class="fas fa-check-circle"></i> Successfully Applied!' });
					});
				};

				vm.requestADMApproval = () => {
					$state.go('opportunityadmin.approvalrequestswu', {
						opportunityId: vm.opportunity.code
					});
				};

				// -------------------------------------------------------------------------
				//
				// publish or un publish the opportunity
				//
				// -------------------------------------------------------------------------
				vm.publish = (opp, isToBePublished) => {
					const publishedState = opp.isPublished;
					const publishError = 'Error ' + (isToBePublished ? 'Publishing' : 'Unpublishing');
					const publishQuestion = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
					const publishSuccess = isToBePublished ? "Your opportunity has been published and we've notified subscribers!" : 'Your opportunity has been unpublished!';
					const publishMethod = isToBePublished ? OpportunitiesService.publish : OpportunitiesService.unpublish;
					let isToBeSaved = true;
					let promise = Promise.resolve();

					if (isToBePublished) {
						promise = ask.yesNo(publishQuestion).then(r => {
							isToBeSaved = r;
						});
					}

					promise.then(() => {
						if (isToBeSaved) {
							opp.isPublished = isToBePublished;
							publishMethod({ opportunityId: opp._id })
								.$promise.then(() => {
									//
									// success, notify
									//
									Notification.success({
										message: '<i class="fas fa-check-circle"></i> ' + publishSuccess
									});
								})
								.catch(res => {
									//
									// fail, notify and stay put
									//
									opp.isPublished = publishedState;
									Notification.error({
										message: res.data.message,
										title: "<i class='fas fa-exclamation-triangle'></i> " + publishError
									});
								});
						}
					});
				};
				// -------------------------------------------------------------------------
				//
				// sign in and apply
				//
				// -------------------------------------------------------------------------
				vm.signInAndApply = () => {
					$state.go('authentication.signin').then(() => {
						$state.previous = {
							state: 'opportunities.viewswu',
							params: { opportunityId: opportunity.code },
							href: $state.href('opportunities.viewswu', { opportunityId: opportunity.code })
						};
					});
				};
				// -------------------------------------------------------------------------
				//
				// unassign an opportunitu
				//
				// -------------------------------------------------------------------------
				vm.unassign = () => {
					const opp = vm.opportunity;
					const q = 'Are you sure you want to un-assign this proponent from this opportunity ?';
					ask.yesNo(q).then(r => {
						if (r) {
							OpportunitiesService.unassign({ opportunityId: opp._id }).$promise.then(
								response => {
									vm.opportunity = response;
									Notification.success({
										message: '<i class="fas fa-check-circle"></i> Proposal Un-Assignment successful!'
									});
								},
								error => {
									Notification.error({
										message: error.data.message,
										title: '<i class="fas fa-exclamation-triangle"></i> Proposal Un-Assignment failed!'
									});
								}
							);
						}
					});
				};
			}
		]);
})();
