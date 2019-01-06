'use strict';

import angular, { IController, IScope, uiNotification } from 'angular';
import _ from 'lodash';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUserService } from '../../../users/client/services/UsersService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export class OpportunityListDirectiveController implements IController {
	public static $inject = ['$scope', 'OpportunitiesService', 'AuthenticationService', 'Notification', 'UsersService'];

	public user: IUser;
	public isAdmin: boolean;
	public isGov: boolean;
	public isLoading: boolean;
	public userCanAdd: boolean;
	public opportunities: IOpportunityResource[];

	constructor(
		private $scope: IScope,
		private OpportunitiesService: IOpportunitiesService,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private UsersService: IUserService
	) {
		this.user = this.AuthenticationService.user;
		this.isAdmin = this.user && this.user.roles.includes('admin');
		this.isGov = this.user && this.user.roles.includes('gov');
		this.isLoading = true;
		this.userCanAdd = this.user && (this.isGov || this.isAdmin);

		this.refreshOpportunities();
	}

	public filterOpen(record: IOpportunityResource): boolean {
		return new Date().getTime() <= new Date(record.deadline).getTime();
	}

	public filterClosed(record: IOpportunityResource): boolean {
		return new Date().getTime() > new Date(record.deadline).getTime();
	}

	public countOpenOpportunities(): number {
		return this.opportunities.filter(opp => {
			return (new Date().getTime() <= new Date(opp.deadline).getTime() &&
				(opp.isPublished || this.isAdmin || this.user.roles.includes(`${opp.code}-admin`)));
		}).length;
	}

	public getTotalClosedAmount(): number {
		return this.opportunities
			.filter(opp => new Date().getTime() > new Date(opp.deadline).getTime())
			.map(opp => (opp.opportunityTypeCd === 'code-with-us' ? opp.earn : opp.budget))
			.reduce((accumAmount, curAmount) => accumAmount + curAmount, 0);
	}

	public async toggleSubscription(): Promise<void> {
		if (!this.user) {
			return;
		}

		this.user.notifyOpportunities = !this.user.notifyOpportunities;
		const updatedUser = await this.UsersService.update(this.user).$promise;
		this.user = updatedUser;
		this.AuthenticationService.user = updatedUser;

		let message: string;
		if (this.user.notifyOpportunities) {
			message =
				'<i class="fas fa-bell"></i> You will be notified of new opportunities';
		} else {
			message =
				'<i class="fas fa-bell-slash"></i> You will no longer be notified of new opportunities';
		}

		this.Notification.success({
			message
		});
	};

	private async refreshOpportunities(): Promise<void> {
		this.isLoading = true;
		this.opportunities = await this.OpportunitiesService.query().$promise;
		this.$scope.$applyAsync();
		this.isLoading = false;
	}
}

angular.module('opportunities').directive('opportunityList', [
	'$state',
	($state => {
		return {
			restrict: 'E',
			controllerAs: 'vm',
			scope: {
				project: '=',
				program: '=',
				title: '@',
				context: '@'
			},
			templateUrl: '/modules/opportunities/client/views/opportunity-list-directive.html',
			controller: OpportunityListDirectiveController
		}
	})
])
