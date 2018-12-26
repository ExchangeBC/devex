'use strict';

import angular, { ISCEService, uiNotification } from 'angular';
import { IStateParamsService, IStateService } from 'angular-ui-router';
import _ from 'lodash';
import IProposalDocument from '../../../proposals/server/interfaces/IProposalDocument';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import IOpportunityDocument from '../../server/interfaces/IOpportunityDocument';
import OpportunitiesCommonService from '../services/OpportunitiesCommonService';
import OpportunitiesService from '../services/OpportunitiesService';

(() => {
	const formatDate = (date: Date): string => {
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
			'authenticationService',
			'opportunitiesService',
			'Notification',
			'ask',
			'myproposal',
			'opportunitiesCommonService',
			function(
				$state: IStateService,
				$stateParams: IStateParamsService,
				$sce: ISCEService,
				org,
				opportunity: IOpportunityDocument,
				authenticationService: AuthenticationService,
				opportunitiesService: OpportunitiesService,
				Notification: uiNotification.INotificationService,
				ask,
				myproposal: IProposalDocument,
				opportunitiesCommonService: OpportunitiesCommonService
			) {
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
				vm.capabilitySkills = opportunitiesCommonService.getTechnicalSkills(opportunity);
				vm.inceptionCapabilities = opportunitiesCommonService.getCapabilitiesForPhase(opportunity.phases.inception);
				vm.prototypeCapabilities = opportunitiesCommonService.getCapabilitiesForPhase(opportunity.phases.proto);
				vm.implementationCapabilities = opportunitiesCommonService.getCapabilitiesForPhase(opportunity.phases.implementation);

				vm.isWatching = opportunitiesCommonService.isWatching(vm.opportunity);
				vm.toggleWatch = () => {
					if (vm.isWatching) {
						vm.removeWatch();
					} else {
						vm.addWatch();
					}
				};
				vm.addWatch = () => {
					vm.isWatching = opportunitiesCommonService.addWatch(vm.opportunity);
				};
				vm.removeWatch = () => {
					vm.isWatching = opportunitiesCommonService.removeWatch(vm.opportunity);
				};

				// what can the user do here?
				const isUser = authenticationService.user;
				const isAdmin = isUser && authenticationService.user.roles.indexOf('admin') !== -1;
				const isGov = isUser && authenticationService.user.roles.indexOf('gov') !== -1;
				vm.isGov = isGov;
				vm.hasEmail = isUser && authenticationService.user.email !== '';
				const isMemberOrWaiting = opportunity.userIs.member || opportunity.userIs.request;
				vm.loggedIn = !!isUser;
				vm.canRequestMembership = isGov && !isMemberOrWaiting;
				vm.canEdit = isAdmin || opportunity.userIs.admin;
				vm.isMember = opportunity.userIs.member;
				vm.isSprintWithUs = vm.opportunity.opportunityTypeCd === 'sprint-with-us';
				vm.showProposals = vm.canEdit && vm.opportunity.isPublished;
				vm.isAdmin = isAdmin;

				// dates
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

				// can this be published?
				vm.errorFields = opportunitiesCommonService.publishStatus(vm.opportunity);
				vm.canPublish = vm.errorFields.length === 0;

				vm.requestADMApproval = () => {
					$state.go('opportunityadmin.approvalrequestswu', {
						opportunityId: vm.opportunity.code
					});
				};

				// publish or un publish the opportunity
				vm.publish = (opp, isToBePublished) => {
					const publishedState = opp.isPublished;
					const publishError = 'Error ' + (isToBePublished ? 'Publishing' : 'Unpublishing');
					const publishQuestion = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
					const publishSuccess = isToBePublished ? "Your opportunity has been published and we've notified subscribers!" : 'Your opportunity has been unpublished!';
					const publishMethod = isToBePublished ? opportunitiesService.getOpportunityResource().publish : opportunitiesService.getOpportunityResource().unpublish;
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

				// unassign an opportunituy
				vm.unassign = () => {
					const opp = vm.opportunity;
					const q = 'Are you sure you want to un-assign this proponent from this opportunity ?';
					ask.yesNo(q).then(r => {
						if (r) {
							opportunitiesService
								.getOpportunityResource()
								.unassign({ opportunityId: opp._id })
								.$promise.then(
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
