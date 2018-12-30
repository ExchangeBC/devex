'use strict';

import angular, { uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import OpportunitiesService from '../../../opportunities/client/services/OpportunitiesService';
import { IProposalResource } from '../services/ProposalService';

export default class ProposalViewCWUController {
	public static $inject = ['$state', 'proposal', 'opportunitiesService', 'Notification', 'ask'];

	constructor(
		private $state: IStateService,
		public proposal: IProposalResource,
		private opportunitiesService: OpportunitiesService,
		private Notification: uiNotification.INotificationService,
		private ask
	) {}

	// close the window
	public close(): void {
		this.$state.go('opportunities.viewcwu', { opportunityId: this.proposal.opportunity.code });
	}

	// Get a font-awesome icon name for the given file type
	public getIconName(type: string): string {
		if (type.indexOf('pdf') > -1) {
			return 'fa-file-pdf';
		} else if (type.indexOf('image') > -1) {
			return 'fa-file-image';
		} else if (type.indexOf('word') > -1) {
			return 'fa-file-word';
		} else if (type.indexOf('excel') > -1 || type.indexOf('sheet') > -1) {
			return 'fa-file-excel';
		} else if (type.indexOf('powerpoint') > -1) {
			return 'fa-file-powerpoint';
		} else {
			return 'fa-file';
		}
	}

	public async assign(): Promise<void> {
		const confirm = 'Are you sure you want to assign this opportunity to this proponent?';
		const choice = await this.ask.yesNo(confirm);
		if (choice) {
			try {
				await this.opportunitiesService.getOpportunityResourceClass().assign({
					opportunityId: this.proposal.opportunity.code,
					proposalId: this.proposal._id
				}).$promise;

				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Proposal has been assigned'
				});

				this.$state.go('opportunities.viewcwu', { opportunityId: this.proposal.opportunity.code });
			} catch (error) {
				this.handleError(error);
			}
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

angular.module('proposals').controller('ProposalViewCWUController', ProposalViewCWUController);
