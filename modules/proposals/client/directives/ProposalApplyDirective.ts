'use strict';

import { StateParams } from '@uirouter/core';
import angular, { IController, IScope } from 'angular';
import moment from 'moment-timezone';
import { IOpportunitiesService, IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import { IOrgCommonService } from '../../../orgs/client/services/OrgCommonService';
import { IOrgResource, IOrgService } from '../../../orgs/client/services/OrgService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import ProposalEditCWUController from '../controllers/ProposalEditCWUController';
import { IProposalResource, IProposalService } from '../services/ProposalService';

interface IProposalApplyScope extends IScope {
	opportunity: IOpportunityResource;
	proposal?: IProposalResource;
	org: IOrgResource;
	isclosed: boolean;
}

enum UserStates {
	CAN_EDIT = 0,
	CAN_ADD,
	GUEST,
	NEEDS_COMPANY,
	NOTHING
}

export enum ProposalModalActions {
	CANCELLED = 0,
	SAVED,
	DELETED
}

export class ProposalApplyDirectiveController implements IController {
	public static $inject = ['$scope', 'AuthenticationService', 'OrgCommonService', 'modalService'];
	public opportunity: IOpportunityResource;
	public isclosed: boolean;
	public proposal: IProposalResource;
	public org: IOrgResource;
	public user: IUser;
	public userState: UserStates;
	public userStates = UserStates;

	constructor(private $scope: IProposalApplyScope, private AuthenticationService: IAuthenticationService, private OrgCommonService: IOrgCommonService, private modalService: any) {
		this.opportunity = $scope.opportunity;
		this.isclosed = $scope.isclosed;
		this.proposal = $scope.proposal;
		this.org = $scope.org;
		this.userState = this.userStates.NOTHING;
		this.user = this.AuthenticationService.user;
		this.refreshDirective();
	}

	public async openProposalApplicationDialog(proposalId?: string): Promise<void> {

		const modalResponse = await this.modalService.showModal({
			size: 'md',
			templateUrl: '/modules/proposals/client/views/cwu-proposal-edit.html',
			controller: ProposalEditCWUController,
			controllerAs: 'ppp',
			resolve: {
				proposal: [
					'ProposalService',
					async (ProposalService: IProposalService) => {
						if (!proposalId) {
							// create a new proposal, and immediately save, the proposal edit controller will handle cleaning up if the user opts not to save their draft
							const proposal = new ProposalService();
							proposal.opportunity = this.opportunity;

							proposal.businessName = this.user.businessName;
							proposal.businessAddress = this.user.businessAddress;
							proposal.businessContactName = this.user.businessContactName;
							proposal.businessContactEmail = this.user.businessContactEmail;
							proposal.businessContactPhone = this.user.businessContactPhone;
							const newProposal = await ProposalService.create(proposal).$promise;
							return newProposal;
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

		let action: ProposalModalActions = ProposalModalActions.CANCELLED;
		if (modalResponse && modalResponse.action) {
			action = modalResponse.action;
		}

		if (action === ProposalModalActions.SAVED) {
			this.$scope.proposal = modalResponse.proposal;
		} else {
			this.$scope.proposal = null;
		}

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
			isclosed: '=',
			proposal: '=',
			org: '='
		},
		controller: ProposalApplyDirectiveController
	};
});
