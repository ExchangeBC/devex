'use strict';

import angular, { IController, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import _ from 'lodash';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOpportunitiesCommonService } from '../services/OpportunitiesCommonService';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export class OpportunityCardDirectiveController implements IController {
	public static $inject = ['$state', 'AuthenticationService', 'OpportunitiesCommonService', 'OpportunitiesService', 'ask', 'Notification'];

	public user: IUser;
	public isAdmin: boolean;

	constructor(
		private $state: IStateService,
		private AuthenticationService: IAuthenticationService,
		private OpportunitiesCommonService: IOpportunitiesCommonService,
		private OpportunitiesService: IOpportunitiesService,
		private ask: any,
		private Notification: uiNotification.INotificationService
	) {
		this.user = this.AuthenticationService.user;
		this.isAdmin = this.user && this.AuthenticationService.user.roles.includes('admin');
	}

	public async publish(opportunity: IOpportunityResource, isPublishing: boolean): Promise<void> {
		const originalPublishedState = opportunity.isPublished;

		if (isPublishing) {
			const question = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
			const choice = await this.ask.yesNo(question);
			if (choice) {
				try {
					opportunity.isPublished = true;
					await this.OpportunitiesService.publish({ opportunityId: opportunity._id }).$promise;
					this.Notification.success({
						title: 'Success',
						message: '<i class="fas fa-check-circle"></i> Your opportunity has been published and we\'ve notified subscribers'
					});
				} catch (error) {
					this.Notification.error({
						title: 'Error',
						message: "<i class='fas fa-exclamation-triangle'></i> Error publishing opportunity"
					});
					opportunity.isPublished = originalPublishedState;
				}
			}
		} else {
			try {
				opportunity.isPublished = false;
				await this.OpportunitiesService.unpublish({ opportunityId: opportunity._id }).$promise;
				this.Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Your opportunity has been unpublished'
				});
			} catch (error) {
				this.Notification.error({
					title: 'Error',
					message: "<i class='fas fa-exclamation-triangle'></i> Error unpublishing opportunity"
				});
				opportunity.isPublished = originalPublishedState;
			}
		}
	}

	public isUserAdmin(opportunity: IOpportunityResource): boolean {
		return this.isAdmin || (this.user && this.user.roles.includes(`${opportunity.code}-admin`));
	}

	public isWatching(opportunity: IOpportunityResource): boolean {
		return this.OpportunitiesCommonService.isWatching(opportunity);
	}

	public toggleWatch(opportunity: IOpportunityResource): void {
		if (this.isWatching(opportunity)) {
			opportunity.isWatching = this.OpportunitiesCommonService.removeWatch(opportunity);
		} else {
			opportunity.isWatching = this.OpportunitiesCommonService.addWatch(opportunity);
		}
	}

	public goToView(opportunity: IOpportunityResource): void {
		if (opportunity.opportunityTypeCd === 'code-with-us') {
			this.$state.go('opportunities.viewcwu', {
				opportunityId: opportunity.code
			});
		} else {
			this.$state.go('opportunities.viewswu', {
				opportunityId: opportunity.code
			});
		}
	}

	public goToEditView(opportunity: IOpportunityResource): void {
		if (opportunity.opportunityTypeCd === 'code-with-us') {
			this.$state.go('opportunityadmin.editcwu', {
				opportunityId: opportunity.code
			});
		} else {
			this.$state.go('opportunityadmin.editswu', {
				opportunityId: opportunity.code
			});
		}
	}

	public getDeadline(opportunity: IOpportunityResource): string {
		let ret = 'CLOSED';
		const dateDiff = new Date(opportunity.deadline).getTime() - new Date().getTime();
		if (dateDiff > 0) {
			const dd = Math.floor(dateDiff / 86400000); // days
			const dh = Math.floor((dateDiff % 86400000) / 3600000); // hours
			const dm = Math.round(((dateDiff % 86400000) % 3600000) / 60000); // minutes
			if (dd > 0) {
				ret = dd + ' days ' + dh + ' hours ' + dm + ' minutes';
			} else if (dh > 0) {
				ret = dh + ' hours ' + dm + ' minutes';
			} else {
				ret = dm + ' minutes';
			}
		}
		return ret;
	}

	public getOpportunitySkills(opportunity: IOpportunityResource): ICapabilitySkill[] {
		return _.flatten(
			_.unionWith(
				opportunity.phases.inception.capabilitySkills,
				opportunity.phases.proto.capabilitySkills,
				opportunity.phases.implementation.capabilitySkills,
				(sk1, sk2) => sk1.code === sk2.code
			)
		);
	}
}

angular.module('opportunities').directive('opportunityCard', [
	'$state',
	($state: IStateService) => {
		return {
			restrict: 'E',
			controllerAs: 'vm',
			scope: {
				opportunity: '='
			},
			templateUrl: '/modules/opportunities/client/views/opportunity-card-directive.html',
			controller: OpportunityCardDirectiveController
		};
	}
]);
