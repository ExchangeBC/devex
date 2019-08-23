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
	public openOpportunities: IOpportunityResource[];
	public closedOpportunities: IOpportunityResource[];
	public closedOpportunitiesLength: number;

	private limit: number;
	private skip: number;
	private page: number;

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

		this.limit = this.skip = parseInt($scope.limit, 10) || 0;
		this.page = 1;
		this.refreshOpportunities();
	}

	public countOpenOpportunities(): number {
		return this.openOpportunities.filter(opp => {
			return ((opp.isPublished || this.isAdmin || this.user.roles.includes(`${opp.code}-admin`)));
		}).length;
	}

	public getTotalClosedAmount(): number {
		return this.closedOpportunities
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

	public async loadMoreClosedOpps(): Promise<void> {
		const opportunitiesLeft = this.closedOpportunitiesLength[0] - this.skip * this.page;
		let nextItems = [];
		if (opportunitiesLeft >= this.skip) {
			nextItems = await this.OpportunitiesService.query({ status: 'closed', limit: this.limit, skip: (this.skip * this.page) }).$promise;
		} else {
			nextItems = await this.OpportunitiesService.query({ status: 'closed', skip: (this.skip * this.page) }).$promise;
		}
		this.closedOpportunities = [...this.closedOpportunities, ...nextItems];
		this.page++;
	}

	// check if there is more closed opportunities left to show
	public isThereMore(): boolean {
		return this.closedOpportunitiesLength[0] > (this.skip * this.page) ? true : false;
	}

	private async refreshOpportunities(): Promise<void> {
		this.isLoading = true;
		this.closedOpportunitiesLength = await this.OpportunitiesService.query({ count: true, status: 'closed' }).$promise;
		this.openOpportunities = await this.OpportunitiesService.query({ status: 'open' }).$promise;
		this.closedOpportunities = await this.OpportunitiesService.query({ status: 'closed', limit: this.limit }).$promise;
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
				context: '@',
				limit: '@'
			},
			templateUrl: (elem, attr) => {
				return `/modules/opportunities/client/views/opportunity-${attr.context}-list-directive.html`
			},
			controller: OpportunityListDirectiveController
		}
	})
])
