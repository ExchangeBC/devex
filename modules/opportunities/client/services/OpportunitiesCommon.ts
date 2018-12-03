'use strict';

import angular from 'angular';
import * as _ from 'lodash';

(() => {
	angular.module('opportunities').factory('OpportunitiesCommon', [
		'$sce',
		'Authentication',
		'OpportunitiesService',
		'Notification',
		($sce, Authentication, OpportunitiesService, Notification) => {
			return {
				// Check if the current user is currently watching this opportunity
				isWatching: opportunity => {
					if (Authentication.user) {
						return opportunity.watchers.indexOf(Authentication.user._id) !== -1;
					} else {
						return false;
					}
				},

				// Add current user to the watchers list - this assumes that ths function could
				// not be run except if the user was not already on the list
				addWatch: opportunity => {
					opportunity.watchers.push(Authentication.user._id);
					OpportunitiesService.addWatch({
						opportunityId: opportunity._id
					});
					Notification.success({ message: '<i class="fas fa-eye"></i><br/><br/>You are now watching<br/>' + opportunity.name });
					return true;
				},

				// Remove the current user from the list
				removeWatch: opportunity => {
					opportunity.watchers.splice(opportunity.watchers.indexOf(Authentication.user._id), 1);
					OpportunitiesService.removeWatch({
						opportunityId: opportunity._id
					});
					Notification.success({ message: '<i class="fas fa-eye-slash"></i><br/><br/>You are no longer watching<br/>' + opportunity.name });
					return false;
				},

				// Checks for whether or not fields are missing and whether we can publish
				publishStatus: opportunity => {
					if (!opportunity.phases) {
						opportunity.phases = {
							implementation: {},
							inception: {},
							proto: {}
						};
					}
					const fields = {
						common: [
							[opportunity.name, 'Title'],
							[opportunity.short, 'Teaser'],
							[opportunity.description, 'Background / Summary'],
							[opportunity.github, 'Github Repository'],
							[opportunity.program, 'Program'],
							[opportunity.project, 'Project'],
							[opportunity.deadline, 'Proposal Deadline'],
							[opportunity.assignment, 'Assignment Date'],
							[opportunity.location, 'Location']
						],
						cwu: [
							[opportunity.evaluation, 'Proposal Evaluation Criteria'],
							[opportunity.criteria, 'Acceptance Criteria'],
							[opportunity.skills, 'Required Skills'],
							[opportunity.earn, 'Fixed-Price Reward'],
							[opportunity.start, 'Proposed Start Date']
						],
						swu: [
							[opportunity.budget > 0, 'Total Opportunity Budget'],
							[opportunity.phases.implementation.isImplementation || opportunity.phases.inception.isInception || opportunity.phases.proto.isPrototype, 'Phase Selection and Information'],
							[
								!opportunity.phases.implementation.isImplementation || (opportunity.phases.implementation.isImplementation && opportunity.phases.implementation.endDate),
								'Implementation Phase End Date'
							],

							[
								!opportunity.phases.implementation.isImplementation || (opportunity.phases.implementation.isImplementation && opportunity.phases.implementation.startDate),
								'Implementation Phase Start Date'
							],
							[!opportunity.phases.inception.isInception || (opportunity.phases.inception.isInception && opportunity.phases.inception.endDate), 'Inception Phase End Date'],
							[!opportunity.phases.inception.isInception || (opportunity.phases.inception.isInception && opportunity.phases.inception.startDate), 'Inception Phase Start Date'],
							[!opportunity.phases.proto.isPrototype || (opportunity.phases.proto.isPrototype && opportunity.phases.proto.endDate), 'Prototype Phase End Date'],
							[!opportunity.phases.proto.isPrototype || (opportunity.phases.proto.isPrototype && opportunity.phases.proto.startDate), 'Prototype Phase Start Date']
						]
					};

					const errorFields = fields.common.reduce((accum, elem) => {
						if (!elem[0]) {
							accum.push(elem[1]);
						}
						return accum;
					}, []);

					if (opportunity.opportunityTypeCd === 'code-with-us') {
						fields.cwu.forEach(elem => {
							if (!elem[0]) {
								errorFields.push(elem[1]);
							}
						});
					} else {
						fields.swu.forEach(elem => {
							if (!elem[0]) {
								errorFields.push(elem[1]);
							}
						});
					}
					return errorFields;
				},

				// All the common setup on the scope
				setScopeView(vm, opportunity, myproposal) {
					vm.myproposal = myproposal;
					vm.opportunity = opportunity;
					vm.pageViews = opportunity.views;
					vm.opportunity.deadline = new Date(vm.opportunity.deadline);
					vm.opportunity.assignment = new Date(vm.opportunity.assignment);
					vm.authentication = Authentication;
					vm.display = {};
					vm.display.description = $sce.trustAsHtml(vm.opportunity.description);
					vm.display.evaluation = $sce.trustAsHtml(vm.opportunity.evaluation);
					vm.display.criteria = $sce.trustAsHtml(vm.opportunity.criteria);
					vm.trust = $sce.trustAsHtml;

					const isUser = Authentication.user;
					const isAdmin = isUser && Authentication.user.roles.indexOf('admin') !== -1;
					const isGov = isUser && Authentication.user.roles.indexOf('gov') !== -1;
					vm.isGov = isGov;
					vm.hasEmail = isUser && Authentication.user.email !== '';
					const isMemberOrWaiting = opportunity.userIs.member || opportunity.userIs.request;
					vm.loggedIn = isUser;
					vm.canRequestMembership = isGov && !isMemberOrWaiting;
					vm.canEdit = isAdmin || opportunity.userIs.admin;
					vm.isMember = opportunity.userIs.member;
					vm.isSprintWithUs = vm.opportunity.opportunityTypeCd === 'sprint-with-us';
					vm.showProposals = vm.canEdit && vm.opportunity.isPublished;

					const rightNow = new Date();
					vm.closing = 'CLOSED';
					const diffTime = vm.opportunity.deadline - rightNow.getTime();
					if (diffTime > 0) {
						const dd = Math.floor(diffTime / 86400000); // days
						const dh = Math.floor((diffTime % 86400000) / 3600000); // hours
						const dm = Math.round(((diffTime % 86400000) % 3600000) / 60000); // minutes
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
					vm.canPublish = vm.errorFields.length === 0;
				},

				// Request a 2FA authentication code to be sent to the designated contact in the opportunity approval info
				// Returns true for success, false for failure
				requestApprovalCode(opportunity) {
					const approvalInfo = opportunity.intermediateApproval.state === 'sent' ? opportunity.intermediateApproval : opportunity.finalApproval;
					if (approvalInfo.twoFASendCount < 5) {
						OpportunitiesService.requestCode({ opportunityId: opportunity.code });
						return true;
					} else {
						return false;
					}
				},

				// Submit the passed approval code
				// Return a promise that will resolve for success, reject otherwise
				submitApprovalCode(opportunity, submittedCode, action) {
					return new Promise((resolve, reject) => {
						const isPreApproval = opportunity.intermediateApproval.state === 'sent'; // Has intermediate approval been actioned or is still at 'sent state'?
						const approvalInfo = isPreApproval ? opportunity.intermediateApproval : opportunity.finalApproval;

						if (approvalInfo.twoFAAttemptCount < 5) {
							OpportunitiesService.submitCode({
								opportunityId: opportunity.code,
								code: submittedCode,
								action: action.toLowerCase(),
								preapproval: isPreApproval.toString()
							})
								.$promise.then(response => {
									resolve(response.message);
								})
								.catch(err => {
									reject(err);
								});
						} else {
							reject('Maximum attempts reached');
						}
					});
				},

				// Return a list of all technical skills for an opportunity
				// Merges and removes duplicates across phases
				getTechnicalSkills: (opportunity) => {
					return _.unionWith(
						opportunity.phases.inception.capabilitySkills,
						opportunity.phases.proto.capabilitySkills,
						opportunity.phases.implementation.capabilitySkills,
						(a: any, b: any) => {
							return a.code === b.code;
						}
					);
				},

				// Return a list of required capabilities for the given phase
				// Each returned capabilitity in the list is marked with fullTime = true if
				// it is a core capability
				getCapabilitiesForPhase: (phase) => {

					const coreCodes = phase.capabilitiesCore.map(cap => {
						return cap.code;
					});

					phase.capabilities.forEach(cap => {
						if (coreCodes.indexOf(cap.code) !== -1) {
							cap.fullTime = true;
						}
					});

					return phase.capabilities;
				}
			};
		}
	]);
})();
