'use strict';

import angular, { IController, uiNotification } from 'angular';
import _ from 'lodash';
import moment from 'moment-timezone';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IProposalResource } from '../../../proposals/client/services/ProposalService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOpportunitiesCommonService } from '../services/OpportunitiesCommonService';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export default class OpportunityViewSWUController implements IController {
	public static $inject = ['org', 'opportunity', 'AuthenticationService', 'OpportunitiesService', 'Notification', 'ask', 'myproposal', 'OpportunitiesCommonService'];

	public canEdit: boolean;
	public canPublish: boolean;
	public hasEmail: boolean;
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
		private AuthenticationService: IAuthenticationService,
		private OpportunitiesService: IOpportunitiesService,
		private Notification: uiNotification.INotificationService,
		private ask: any,
		public myproposal: IProposalResource,
		private OpportunitiesCommonService: IOpportunitiesCommonService
	) {
		this.isUser = !!this.AuthenticationService.user;
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.indexOf('admin') !== -1;
		this.hasEmail = this.isUser && this.AuthenticationService.user.email !== '';

		this.refreshOpportunity(this.opportunity);
	}

	// publish the opportunity
	public async publish(isToBePublished: boolean): Promise<void> {
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
					message: '<i class="fas fa-check-circle"></i> ' + publishSuccess
				});
			} catch (error) {
				// if an error occurred during publication, retrieve the opportunity as it may have still be published but the github issue may have failed
				this.opportunity = await this.OpportunitiesService.get({ opportunityId: this.opportunity._id }).$promise;
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
				const updatedOpportunity = await this.OpportunitiesService.unassign({ opportunityId: opp._id }).$promise;

				this.refreshOpportunity(updatedOpportunity);

				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Proposal Un-Assignment successful'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// Format dates to always be in PST (America/Vancouver timezone)
	public formatDate(date: string, includeTime: boolean): string {
		const momentDate = moment(date);
		const dateFormat = includeTime ? 'MMMM Do YYYY, HH:mm z' : 'MMMM Do YYYY';
		return momentDate.tz('America/Vancouver').format(dateFormat);
	}

	public isFullTime(capability: ICapabilityResource, coreCapabilities: ICapabilityResource[]): boolean {
		return coreCapabilities.map(cap => cap.code).includes(capability.code);
	}

	public isClosed(): boolean {
		return new Date(this.opportunity.deadline).getTime() - new Date().getTime() < 0;
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
		// this.opportunity.deadline = new Date(this.opportunity.deadline);
		this.opportunity.assignment = new Date(this.opportunity.assignment);
		this.opportunity.start = new Date(this.opportunity.start);
		this.errorFields = this.OpportunitiesCommonService.publishStatus(this.opportunity);
		this.isWatching = this.OpportunitiesCommonService.isWatching(this.opportunity);
		this.canEdit = this.isAdmin || this.opportunity.userIs.admin;
		this.showProposals = this.canEdit && this.opportunity.isPublished;
		this.capabilitySkills = _.uniqWith(
			_.union(this.opportunity.phases.inception.capabilitySkills, this.opportunity.phases.proto.capabilitySkills, this.opportunity.phases.implementation.capabilitySkills),
			(skill1, skill2) => skill1.code === skill2.code
		);

		// can this be published?
		this.errorFields = this.OpportunitiesCommonService.publishStatus(this.opportunity);
		this.canPublish = this.errorFields.length === 0;
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('opportunities').controller('OpportunityViewSWUController', OpportunityViewSWUController);
