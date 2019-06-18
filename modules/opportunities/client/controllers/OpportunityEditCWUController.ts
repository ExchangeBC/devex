'use strict';

import { StateService } from '@uirouter/core';
import angular, { IFormController, uiNotification } from 'angular';
import { IDataService } from '../../../core/client/services/DataService';
import { IProject } from '../../../projects/shared/IProjectDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export default class OpportunityEditCWUController {
	public static $inject = ['$state', 'opportunity', 'editing', 'projects', 'AuthenticationService', 'Notification', 'DataService', 'ask', 'TinyMceConfiguration', 'OpportunitiesService'];

	public isAdmin: boolean;
	public isGov: boolean;
	public errorFields: any[];
	public canPublish: boolean;
	public amounts: number[];
	public cities: string[];
	public opportunityForm: IFormController;
	public projectLink: boolean;

	private originalPublishedState: boolean;
	private isUser: boolean;

	constructor(
		private $state: StateService,
		public opportunity: IOpportunityResource,
		public editing: boolean,
		public projects: IProject[],
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private DataService: IDataService,
		private ask,
		public TinyMceConfiguration,
		private OpportunitiesService: IOpportunitiesService
	) {
		// set up roles/permissions
		this.isUser = !!AuthenticationService.user;
		this.isAdmin = this.isUser && AuthenticationService.user.roles.indexOf('admin') !== -1;
		this.isGov = this.isUser && AuthenticationService.user.roles.indexOf('gov') !== -1;

		// set up the dropdown amounts for CWU earnings
		this.initDropDownAmounts();
		this.cities = this.DataService.cities;

		// if the user doesn't have the right access then kick them out
		if (this.editing && !this.isAdmin && !this.opportunity.userIs.admin) {
			$state.go('forbidden');
		}

		// if there are no available projects then post a warning and kick the user back to
		// where they came from
		if (this.projects.length === 0) {
			this.Notification.error({
				message: 'You do not have a project for which you are able to create an opportunity. Please browse to or create a project to put the new opportunity under.'
			});
			$state.go('opportunities.list');
		} else if (this.projects.length === 1) {
			this.projectLink = true;
			this.opportunity.project = this.projects[0];
			this.opportunity.program = this.projects[0].program;
		}

		this.refreshOpportunity(this.opportunity);
	}

	public updateProgramProject() {
		this.opportunity.program = this.opportunity.project.program;
	}

	// remove the opportunity with some confirmation
	public async remove(): Promise<void> {
		const confirmMessage = 'Please confirm opportunity deletion';
		const choice = await this.ask.yesNo(confirmMessage);
		if (choice) {
			this.opportunity.$remove(() => {
				this.$state.go('opportunities.list');
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> opportunity deleted successfully!'
				});
			});
		}
	}

	public async save(): Promise<void> {
		if (!this.opportunity.name) {
			this.Notification.error({
				message: 'You must enter a title for your opportunity',
				title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
			});
			return;
		}

		if (this.opportunity.skilllist && this.opportunity.skilllist !== '') {
			this.opportunity.skills = this.opportunity.skilllist.split(/ *, */);
		} else {
			this.opportunity.skills = [];
		}

		// ensure that there is a trailing '/' on the github field
		if (this.opportunity.github && this.opportunity.github.substr(-1, 1) !== '/') {
			this.opportunity.github += '/';
		}

		// set the time on the 2 dates that care about it
		this.opportunity.deadline.setHours(16);
		this.opportunity.deadline.setMinutes(0);
		this.opportunity.deadline.setSeconds(0);
		this.opportunity.assignment.setHours(16);

		// confirm save only if the user is also publishing
		let isSaving = true;
		if (!this.originalPublishedState && this.opportunity.isPublished) {
			const question = 'You are publishing this opportunity. This will also notify all subscribed users.  Do you wish to continue?';
			isSaving = await this.ask.yesNo(question);
		}

		// Create a new opportunity, or update the current instance
		try {
			if (!isSaving) {
				throw new Error('Publish cancelled');
			}

			let updatedOpportunity: IOpportunityResource;
			if (this.editing) {
				updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} else {
				updatedOpportunity = await this.OpportunitiesService.create(this.opportunity).$promise;
			}

			this.refreshOpportunity(updatedOpportunity);
			this.opportunityForm.$setPristine();
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Opportunity saved'
			});

			// if creating a new opportunity, transition to the edit view after saving
			if (!this.editing) {
				this.$state.go('opportunityadmin.editcwu', { opportunityId: this.opportunity.code });
			}
		} catch (error) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> " + error.data.message
			});
		}
	}

	// send a request for administrative approval
	public async sendApprovalRequest(): Promise<void> {
		if (!this.opportunityForm.$valid) {
			if (this.opportunityForm.$error.required) {
				this.Notification.error({
					title: 'Error',
					message: 'Please fill out all required fields (*) before sending'
				});
			}
			return;
		}

		const confirmMessage = 'Are you sure you are ready to send the requests with the entered contact information?';
		const choice = await this.ask.yesNo(confirmMessage);
		if (choice) {
			// Generate a route code that will be used to provide some protection on the route used to approve
			this.opportunity.intermediateApproval.routeCode = new Date().valueOf().toString();
			this.opportunity.intermediateApproval.state = 'ready-to-send';
			this.opportunity.intermediateApproval.requestor = this.AuthenticationService.user;
			this.opportunity.intermediateApproval.initiated = new Date();
			this.opportunity.finalApproval.requestor = this.AuthenticationService.user;

			try {
				let updatedOpportunity: IOpportunityResource;
				if (this.editing) {
					updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
				} else {
					updatedOpportunity = await this.OpportunitiesService.create(this.opportunity).$promise;
				}

				this.refreshOpportunity(updatedOpportunity);
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Approval request sent!'
				});
			} catch (error) {
				this.Notification.error({
					title: 'Error',
					message: "<i class='fas fa-exclamation-triangle'></i> " + error.data.message
				});
			}
		}
	}

	// reset the approval request process (this is an admin only function, mostly for development)
	public async resetApprovalRequest(): Promise<void> {
		if (!this.isAdmin) {
			return;
		}

		this.opportunity.intermediateApproval.state = 'draft';
		this.opportunity.intermediateApproval.action = 'pending';
		this.opportunity.intermediateApproval.initiated = null;
		this.opportunity.intermediateApproval.actioned = null;

		this.opportunity.finalApproval.state = 'draft';
		this.opportunity.finalApproval.action = 'pending';
		this.opportunity.finalApproval.initiated = null;
		this.opportunity.finalApproval.actioned = null;

		this.opportunity.isApproved = false;

		try {
			let updatedOpportunity: IOpportunityResource;
			if (this.editing) {
				updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} else {
				updatedOpportunity = await this.OpportunitiesService.create(this.opportunity).$promise;
			}

			this.refreshOpportunity(updatedOpportunity);
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Approval request reset'
			});
		} catch (error) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> " + error.data.message
			});
		}
	}

	private initDropDownAmounts() {
		this.amounts = [];
		let i: number;
		for (i = 500; i <= 70000; i += 500) {
			this.amounts.push(i);
		}
	}

	// Refresh the view model to use the given opportunity
	// This is mostly used after an opportunity is saved using the api and
	// we want to ensure we have the most recent version loaded in the UI
	private refreshOpportunity(newOpportunity: IOpportunityResource) {
		this.opportunity = newOpportunity;
		this.opportunity.opportunityTypeCd = 'code-with-us';
		this.opportunity.deadline = new Date(this.opportunity.deadline);
		this.opportunity.assignment = new Date(this.opportunity.assignment);
		this.opportunity.start = new Date(this.opportunity.start);
		this.opportunity.skilllist = this.opportunity.skills ? this.opportunity.skills.join(', ') : '';
		this.originalPublishedState = this.opportunity.isPublished;

		// If editing an existing opportunity...
		if (this.editing) {
			this.projectLink = true;
		} else {
			this.projectLink = false;

			// if not editing, set default dates
			this.opportunity.deadline = new Date();
			this.opportunity.assignment = new Date();
			this.opportunity.start = new Date();
		}
	}
}

angular.module('opportunities').controller('OpportunityEditCWUController', OpportunityEditCWUController);
