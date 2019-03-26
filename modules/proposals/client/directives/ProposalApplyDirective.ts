'use strict';

import { StateParams } from '@uirouter/core';
import angular, { IController, IScope } from 'angular';
import moment from 'moment-timezone';
import { IOpportunitiesService, IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import { IOrgCommonService } from '../../../orgs/client/services/OrgCommonService';
import { IOrgResource, IOrgService } from '../../../orgs/client/services/OrgService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import ProposalEditCWUController from '../controllers/ProposalEditCWUController';
import { IProposalResource, IProposalService } from '../services/ProposalService';

interface IProposalApplyScope extends IScope {
	opportunity: IOpportunityResource;
	proposal?: IProposalResource;
	org: IOrgResource;
}

enum UserStates {
	CAN_EDIT = 0,
	CAN_ADD,
	GUEST,
	NEEDS_COMPANY,
	NOTHING
}

export class ProposalApplyDirectiveController implements IController {
	public static $inject = ['$scope', 'AuthenticationService', 'OrgCommonService', 'modalService'];
	public opportunity: IOpportunityResource;
	public proposal: IProposalResource;
	public org: IOrgResource;
	public userState: UserStates;
	public userStates = UserStates;

	constructor(private $scope: IProposalApplyScope, private AuthenticationService: IAuthenticationService, private OrgCommonService: IOrgCommonService, private modalService: any) {
		this.opportunity = $scope.opportunity;
		this.proposal = $scope.proposal;
		this.org = $scope.org;
		this.userState = this.userStates.NOTHING;

		this.refreshDirective();
	}

	public async openProposalApplicationDialog(editing: boolean, proposalId?: string): Promise<void> {

		const modalResponse = await this.modalService.showModal({
			size: 'lg',
			templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
			controller: ProposalEditCWUController,
			controllerAs: 'ppp',
			resolve: {
				editing: () => editing,
				proposal: [
					'ProposalService',
					(ProposalService: IProposalService) => {
						if (!editing) {
							return new ProposalService();
						} else {
							return ProposalService.get({ proposalId }).$promise;
						}
					}
				],
				opportunity: [
					'$stateParams',
					'OpportunitiesService',
					($stateParams: StateParams, OpportunitiesService: IOpportunitiesService) => {
						return OpportunitiesService.get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				],
				org: [
					'AuthenticationService',
					'OrgService',
					(AuthenticationService: IAuthenticationService, OrgService: IOrgService) => {
						if (!AuthenticationService.user) {
							return {};
						}
						return OrgService.myadmin().$promise.then(orgs => {
							if (orgs && orgs.length > 0) {
								return orgs[0];
							} else {
								return null;
							}
						});
					}
				]
			}
		});

		this.$scope.proposal = modalResponse.proposal;
		this.refreshDirective();
	}

	// Format dates to always be in PST (America/Vancouver timezone)
	public formatDate(date: string, includeTime: boolean): string {
		const momentDate = moment(date);
		const dateFormat = includeTime ? 'MMMM Do YYYY, HH:mm z' : 'MMMM Do YYYY';
		return momentDate.tz('America/Vancouver').format(dateFormat);
	}

	private refreshDirective(): void {
		this.proposal = this.$scope.proposal;

		const isUser = !!this.AuthenticationService.user;
		const isAdmin = isUser && this.AuthenticationService.user.roles.includes('admin');
		const isGov = isUser && this.AuthenticationService.user.roles.includes('gov');
		const isProposal = this.proposal && this.proposal._id;
		const canEdit = !isAdmin && !isGov;

		if (!isUser) {
			this.userState = this.userStates.GUEST;
		} else if (canEdit) {
			if (isProposal) {
				this.userState = this.userStates.CAN_EDIT;
			} else if (this.opportunity.opportunityTypeCd !== 'sprint-with-us' || (this.org && this.OrgCommonService.hasOrgMetRFQ(this.org))) {
				this.userState = this.userStates.CAN_ADD;
			} else {
				this.userState = this.userStates.NEEDS_COMPANY;
			}
		}
	}
}

angular.module('proposals').directive('proposalApply', () => {
	return {
		restrict: 'E',
		controllerAs: '$ctrl',
		templateUrl: '/modules/proposals/client/views/proposal-apply.directive.html',
		scope: {
			opportunity: '=',
			proposal: '=',
			org: '='
		},
		controller: ProposalApplyDirectiveController
	};
});
