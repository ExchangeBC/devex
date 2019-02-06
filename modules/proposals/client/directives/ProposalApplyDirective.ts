'use strict';

import angular, { IController, IScope } from 'angular';
import moment from 'moment-timezone';
import { IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import { IOrgCommonService } from '../../../orgs/client/services/OrgCommonService';
import { IOrgResource } from '../../../orgs/client/services/OrgService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IProposalResource } from '../services/ProposalService';

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
	public static $inject = ['$scope', 'AuthenticationService', 'OrgCommonService'];
	public opportunity: IOpportunityResource;
	public proposal: IProposalResource;
	public org: IOrgResource;
	public userState: UserStates;
	public userStates = UserStates;

	constructor($scope: IProposalApplyScope, AuthenticationService: IAuthenticationService, private OrgCommonService: IOrgCommonService) {
		this.opportunity = $scope.opportunity;
		this.proposal = $scope.proposal;
		this.org = $scope.org;
		this.userState = this.userStates.NOTHING;

		const isUser = !!AuthenticationService.user;
		const isAdmin = isUser && AuthenticationService.user.roles.includes('admin');
		const isGov = isUser && AuthenticationService.user.roles.includes('gov');
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

	// Format dates to always be in PST (America/Vancouver timezone)
	public formatDate(date: string, includeTime: boolean): string {
		const momentDate = moment(date);
		const dateFormat = includeTime ? 'MMMM Do YYYY, HH:mm z' : 'MMMM Do YYYY';
		return momentDate.tz('America/Vancouver').format(dateFormat);
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
