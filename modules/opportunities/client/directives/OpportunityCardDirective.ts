'use strict';

import { StateService } from '@uirouter/core';
import angular, { IController, IScope, uiNotification } from 'angular';
import _ from 'lodash';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOpportunitiesCommonService } from '../services/OpportunitiesCommonService';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

interface IOpportunityCardScope extends IScope {
	opportunity: IOpportunityResource;
}

export class OpportunityCardDirectiveController implements IController {
	public static $inject = ['$scope', '$state', 'AuthenticationService', 'OpportunitiesCommonService', 'OpportunitiesService', 'ask', 'Notification'];

	public user: IUser;
	public isAdmin: boolean;
	public opportunity: IOpportunityResource;
	public oppSkills: ICapabilitySkill[];

	constructor(
		private $scope: IOpportunityCardScope,
		private $state: StateService,
		private AuthenticationService: IAuthenticationService,
		private OpportunitiesCommonService: IOpportunitiesCommonService,
		private OpportunitiesService: IOpportunitiesService,
		private ask: any,
		private Notification: uiNotification.INotificationService
	) {
		this.user = this.AuthenticationService.user;
		this.isAdmin = this.user && this.AuthenticationService.user.roles.includes('admin');
		this.opportunity = this.$scope.opportunity;
		this.getOpportunitySkills();
	}

	public async publish(isPublishing: boolean): Promise<void> {
		const originalPublishedState = this.opportunity.isPublished;

		if (isPublishing) {
			const question = "When you publish this opportunity, we'll notify all our subscribed users. Are you sure you've got it just the way you want it?";
			const choice = await this.ask.yesNo(question);
			if (choice) {
				try {
					this.opportunity.isPublished = true;
					await this.OpportunitiesService.publish({ opportunityId: this.opportunity._id }).$promise;
					this.Notification.success({
						message: '<i class="fas fa-check-circle"></i> Your opportunity has been published and we\'ve notified subscribers'
					});
				} catch (error) {
					this.Notification.error({
						title: 'Error',
						message: "<i class='fas fa-exclamation-triangle'></i> Error publishing opportunity"
					});
					this.opportunity.isPublished = originalPublishedState;
				}
			}
		} else {
			try {
				this.opportunity.isPublished = false;
				await this.OpportunitiesService.unpublish({ opportunityId: this.opportunity._id }).$promise;
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Your opportunity has been unpublished'
				});
			} catch (error) {
				this.Notification.error({
					title: 'Error',
					message: "<i class='fas fa-exclamation-triangle'></i> Error unpublishing opportunity"
				});
				this.opportunity.isPublished = originalPublishedState;
			}
		}
	}

	public isUserAdmin(): boolean {
		return this.isAdmin || (this.user && this.user.roles.includes(`${this.opportunity.code}-admin`));
	}

	public isWatching(): boolean {
		return this.OpportunitiesCommonService.isWatching(this.opportunity);
	}

	public toggleWatch(): void {
		if (this.isWatching()) {
			this.opportunity.isWatching = this.OpportunitiesCommonService.removeWatch(this.opportunity);
		} else {
			this.opportunity.isWatching = this.OpportunitiesCommonService.addWatch(this.opportunity);
		}
	}

	public goToView(editView?: boolean): void {
		let routeName: string;
		if (editView) {
			routeName = this.opportunity.opportunityTypeCd === 'code-with-us' ? 'opportunityadmin.editcwu' : 'opportunityadmin.editswu';
		} else {
			routeName = this.opportunity.opportunityTypeCd === 'code-with-us' ? 'opportunities.viewcwu' : 'opportunities.viewswu';
		}

		this.$state.go(routeName, { opportunityId: this.opportunity.code });
	}

	public isClosed(): boolean {
		return new Date(this.opportunity.deadline).getTime() - new Date().getTime() <= 0;
	}

	public getOpportunitySkills(): void {
		if (this.opportunity.opportunityTypeCd === 'code-with-us') {
			this.oppSkills = this.opportunity.skills.map(sk => {
				return { name: sk, _id: '', code: '' };
			});
		} else {
			this.oppSkills = _.flatten(
				_.unionWith(
					this.opportunity.phases.inception.capabilitySkills,
					this.opportunity.phases.proto.capabilitySkills,
					this.opportunity.phases.implementation.capabilitySkills,
					(sk1, sk2) => sk1.code === sk2.code
				)
			);
		}
	}
}

angular.module('opportunities').directive('opportunityCard', [
	'$state',
	($state: StateService) => {
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
