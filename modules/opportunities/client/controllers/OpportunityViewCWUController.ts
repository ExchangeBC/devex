'use strict';

import angular, { IController, ILocationService, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOpportunityResource, IOpportunitiesService } from '../services/OpportunitiesService';
import { IOpportunitiesCommonService } from '../services/OpportunitiesCommonService';

export default class OpportunityViewCWUController implements IController {
	public static $inject = ['$state', '$location', 'opportunity', 'AuthenticationService', 'OpportunitiesService', 'Notification', 'ask', 'myproposal', 'OpportunitiesCommonService'];

	public showPreApproval: boolean;
	public showFinalApproval: boolean;
	public twoFACode: string;
	public isAdmin: boolean;
	public isGov: boolean;
	public isUser: boolean;
	public showProposals: boolean;
	public errorFields: any[];
	public isWatching: boolean;
	public hasEmail: boolean;
	public canEdit: boolean;
	public closing: string;
	public deadline: string;
	public assignment: string;
	public start: string;

	private approvalAction: string;
	private approvalType: string;
	private approvalCode: string;

	constructor(
		private $state: IStateService,
		private $location: ILocationService,
		public opportunity: IOpportunityResource,
		private AuthenticationService: IAuthenticationService,
		private OpportunitiesService: IOpportunitiesService,
		private Notification: uiNotification.INotificationService,
		private ask,
		public myproposal,
		private OpportunitiesCommonService: IOpportunitiesCommonService
	) {
		// set up roles/permissions
		this.isUser = !!this.AuthenticationService.user;
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.indexOf('admin') !== -1;
		this.isGov = this.isUser && this.AuthenticationService.user.roles.indexOf('gov') !== -1;
		this.hasEmail = this.isUser && this.AuthenticationService.user.email !== '';

		this.refreshOpportunity(this.opportunity);
	}

	public async requestApprovalCode(): Promise<void> {
		try {
			const updatedOpportunity = await this.OpportunitiesCommonService.requestApprovalCode(this.opportunity);
			this.refreshOpportunity(updatedOpportunity);

			this.Notification.success({
				title: 'Success',
				message: 'Approval code sent for 2FA!'
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	public async submitApprovalCode(): Promise<void> {
		try {
			const updatedOpportunity = await this.OpportunitiesCommonService.submitApprovalCode(this.opportunity, this.twoFACode, this.approvalAction);
			this.refreshOpportunity(updatedOpportunity);

			let responseMessage: string;
			if (this.opportunity.finalApproval.state === 'actioned') {
				responseMessage = 'Opportunity Approved!';
			} else {
				responseMessage = 'Opportunity Pre-approved!';
			}

			this.Notification.success({
				title: 'Success',
				message: '<i class="fas fa-thumbs-up"></i> ' + responseMessage
			});
			this.$state.go('home');
		} catch (error) {
			this.handleError(error);
		}
	}

	// (Admin Only) - Removes the opportunity approval requirement
	public async bypassApproval(): Promise<void> {
		if (!this.isAdmin || this.opportunity.isPublished) {
			return;
		}

		try {
			this.opportunity.approvalRequired = false;
			const updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			this.refreshOpportunity(updatedOpportunity);
			this.Notification.success({
				title: 'Success',
				message: '<i class="fas fa-check-circle"></i> Approval Requirement Bypassed'
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	// (Admin Only) - Reinstates the opportunity approval requirement
	public async reinstateApproval(): Promise<void> {
		if (!this.isAdmin || this.opportunity.isPublished) {
			return;
		}

		try {
			this.opportunity.approvalRequired = true;
			const updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			this.refreshOpportunity(updatedOpportunity);
			this.Notification.success({
				title: 'Success',
				message: '<i class="fas fa-check-circle"></i> Approval Requirement Reinstated'
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	public canPublish() {
		return this.errorFields.length === 0 && (!this.opportunity.approvalRequired || this.opportunity.isApproved);
	}

	// publish or un publish the opportunity
	public async publish(isToBePublished: boolean): Promise<void> {
		const publishedState = this.opportunity.isPublished;
		const publishQuestion = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
		const publishSuccess = isToBePublished ? "Your opportunity has been published and we've notified subscribers!" : 'Your opportunity has been unpublished!';
		const publishMethod = isToBePublished ? this.OpportunitiesService.publish : this.OpportunitiesService.unpublish;
		let isToBeSaved = true;

		if (isToBePublished) {
			isToBeSaved = await this.ask.yesNo(publishQuestion);
		}

		if (isToBeSaved) {
			this.opportunity.isPublished = isToBePublished;
			try {
				const updatedOpportunity = await publishMethod({ opportunityId: this.opportunity._id }).$promise;
				this.refreshOpportunity(updatedOpportunity);
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> ' + publishSuccess
				});
			} catch (error) {
				this.opportunity.isPublished = publishedState;
				this.handleError(error);
			}
		}
	}

	// unassign an opportunitu
	public async unassign(): Promise<void> {
		const question = 'Confirm that you want to unassign this opportunity from the assigned proponent';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				const updatedOpportunity = await this.OpportunitiesService.unassign({
					opportunityId: this.opportunity._id,
					proposalId: this.opportunity.proposal._id
				}).$promise;
				this.refreshOpportunity(updatedOpportunity);
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Proposal Unassigned'
				})
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// toggles watch status on the opportunity for the current user
	public toggleWatch() {
		if (this.isWatching) {
			this.removeWatch();
		} else {
			this.addWatch();
		}
	}

	private addWatch() {
		this.isWatching = this.OpportunitiesCommonService.addWatch(this.opportunity);
	}

	private removeWatch() {
		this.isWatching = this.OpportunitiesCommonService.removeWatch(this.opportunity);
	}

	private refreshOpportunity(newOpportunity: IOpportunityResource): void {
		this.opportunity = newOpportunity;
		this.opportunity.deadline = new Date(this.opportunity.deadline);
		this.opportunity.assignment = new Date(this.opportunity.assignment);
		this.opportunity.start = new Date(this.opportunity.start);
		this.errorFields = this.OpportunitiesCommonService.publishStatus(this.opportunity);
		this.isWatching = this.OpportunitiesCommonService.isWatching(this.opportunity);
		this.canEdit = this.isAdmin || this.opportunity.userIs.admin;
		this.showProposals = this.canEdit && this.opportunity.isPublished;
		this.processApprovalState();
		this.calculateTimeLeft();
	}

	private calculateTimeLeft(): void {
		const msPerDay = 86400000;
		const msPerHour = 3600000;
		const msPerMinute = 60000;
		const rightNow = new Date();
		const timeLeft = this.opportunity.deadline.getTime() - rightNow.getTime();
		if (timeLeft > 0) {
			const daysLeft = Math.floor(timeLeft / msPerDay);
			const hoursLeft = Math.floor((timeLeft % msPerDay) / msPerHour);
			const minutesLeft = Math.floor(((timeLeft % msPerDay) % msPerHour) / msPerMinute);
			if (daysLeft > 0) {
				this.closing = daysLeft + ' days ' + hoursLeft + ' hours ' + minutesLeft + ' minutes';
			} else if (hoursLeft > 0) {
				this.closing = hoursLeft + ' hours ' + minutesLeft + ' minutes';
			} else {
				this.closing = minutesLeft + ' minutes';
			}
		} else {
			this.closing = 'CLOSED';
		}

		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		this.deadline =
			this.opportunity.deadline.getHours() +
			':00 Pacific Time, ' +
			dayNames[this.opportunity.deadline.getDay()] +
			', ' +
			monthNames[this.opportunity.deadline.getMonth()] +
			' ' +
			this.opportunity.deadline.getDate() +
			', ' +
			this.opportunity.deadline.getFullYear();

		this.assignment =
			dayNames[this.opportunity.deadline.getDay()] +
			', ' +
			monthNames[this.opportunity.deadline.getMonth()] +
			' ' +
			this.opportunity.deadline.getDate() +
			', ' +
			this.opportunity.deadline.getFullYear();

		this.start =
			dayNames[this.opportunity.deadline.getDay()] +
			', ' +
			monthNames[this.opportunity.deadline.getMonth()] +
			' ' +
			this.opportunity.deadline.getDate() +
			', ' +
			this.opportunity.deadline.getFullYear();
	}

	private processApprovalState(): void {
		// Are the approval or preapproval url params present?
		if (this.$location.search().hasOwnProperty('approvalaction')) {
			this.approvalAction = this.$location.search().approvalaction;
			this.approvalAction = this.approvalAction.charAt(0).toUpperCase() + this.approvalAction.slice(1);
		}

		if (this.$location.search().hasOwnProperty('approvaltype')) {
			this.approvalType = this.$location.search().approvaltype;
		}

		if (this.$location.search().hasOwnProperty('approvalcode')) {
			this.approvalCode = this.$location.search().approvalcode;
		}

		this.showPreApproval =
			!this.opportunity.isPublished &&
			!this.opportunity.isApproved &&
			this.approvalType === 'pre' &&
			this.approvalCode === this.opportunity.intermediateApproval.routeCode &&
			this.opportunity.intermediateApproval.action === 'pending';

		this.showFinalApproval =
			!this.opportunity.isPublished &&
			!this.opportunity.isApproved &&
			this.approvalType === 'final' &&
			this.approvalCode === this.opportunity.finalApproval.routeCode &&
			this.opportunity.finalApproval.action === 'pending';

		// Automatically send code if the first time it's been opened
		if (this.showPreApproval && this.opportunity.intermediateApproval.twoFASendCount === 0) {
			this.requestApprovalCode();
		}
		if (this.showFinalApproval && this.opportunity.finalApproval.twoFASendCount === 0) {
			this.requestApprovalCode();
		}
	}

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('opportunities').controller('OpportunityViewCWUController', OpportunityViewCWUController);
