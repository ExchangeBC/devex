'use strict';

import angular, { IController, uiNotification } from 'angular';
import _ from 'lodash';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IProposalResource } from '../../../proposals/client/services/ProposalService';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import OpportunitiesCommonService from '../services/OpportunitiesCommonService';
import OpportunitiesService, { IOpportunityResource } from '../services/OpportunitiesService';

export default class OpportunityViewSWUController implements IController {
	public static $inject = ['org', 'opportunity', 'authenticationService', 'opportunitiesService', 'Notification', 'ask', 'myproposal', 'opportunitiesCommonService'];

	public canEdit: boolean;
	public canPublish: boolean;
	public hasEmail: boolean;
	public closing = 'CLOSED';
	public errorFields: any[];
	public isWatching: boolean;
	public showProposals: boolean;
	public deadline: string;
	public assignment: string;
	public start: string;
	public capabilitySkills: ICapabilitySkill[];

	private isUser: boolean;
	private isAdmin: boolean;

	constructor(
		public org: IOrg,
		public opportunity: IOpportunityResource,
		private authenticationService: AuthenticationService,
		private opportunitiesService: OpportunitiesService,
		private Notification: uiNotification.INotificationService,
		private ask,
		public myproposal: IProposalResource,
		private opportunitiesCommonService: OpportunitiesCommonService
	) {
		this.isUser = !!this.authenticationService.user;
		this.isAdmin = this.isUser && this.authenticationService.user.roles.indexOf('admin') !== -1;
		this.hasEmail = this.isUser && this.authenticationService.user.email !== '';

		this.refreshOpportunity(this.opportunity);
	}

	// publish the opportunity
	public async publish(isToBePublished: boolean): Promise<void> {
		const publishedState = this.opportunity.isPublished;
		const publishQuestion = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
		const publishSuccess = isToBePublished ? "Your opportunity has been published and we've notified subscribers!" : 'Your opportunity has been unpublished!';
		const publishMethod = isToBePublished ? this.opportunitiesService.getOpportunityResourceClass().publish : this.opportunitiesService.getOpportunityResourceClass().unpublish;
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

	// unassign an opportunituy
	public async unassign(): Promise<void> {
		const opp = this.opportunity;
		const question = 'Are you sure you want to un-assign this proponent from this opportunity?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				const updatedOpportunity = await this.opportunitiesService.getOpportunityResourceClass().unassign({ opportunityId: opp._id }).$promise;

				this.refreshOpportunity(updatedOpportunity);

				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Proposal Un-Assignment successful'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public formatDate(date: Date | string): string {
		const dateObj = date instanceof Date ? date : new Date(date);
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = dateObj.getDate();
		const monthIndex = dateObj.getMonth();
		const year = dateObj.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', ' + year;
	}

	public isFullTime(capability: ICapabilityResource, coreCapabilities: ICapabilityResource[]): boolean {
		return coreCapabilities.map(cap => cap.code).includes(capability.code);
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
		this.isWatching = this.opportunitiesCommonService.addWatch(this.opportunity);
	}

	private removeWatch() {
		this.isWatching = this.opportunitiesCommonService.removeWatch(this.opportunity);
	}

	private refreshOpportunity(newOpportunity: IOpportunityResource): void {
		this.opportunity = newOpportunity;
		this.opportunity.deadline = new Date(this.opportunity.deadline);
		this.opportunity.assignment = new Date(this.opportunity.assignment);
		this.opportunity.start = new Date(this.opportunity.start);
		this.errorFields = this.opportunitiesCommonService.publishStatus(this.opportunity);
		this.isWatching = this.opportunitiesCommonService.isWatching(this.opportunity);
		this.canEdit = this.isAdmin || this.opportunity.userIs.admin;
		this.showProposals = this.canEdit && this.opportunity.isPublished;
		this.capabilitySkills = _.uniqWith(
			_.union(this.opportunity.phases.inception.capabilitySkills, this.opportunity.phases.proto.capabilitySkills, this.opportunity.phases.implementation.capabilitySkills),
			(skill1, skill2) => skill1.code === skill2.code
		);

		// can this be published?
		this.errorFields = this.opportunitiesCommonService.publishStatus(this.opportunity);
		this.canPublish = this.errorFields.length === 0;

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

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('opportunities').controller('OpportunityViewSWUController', OpportunityViewSWUController);
