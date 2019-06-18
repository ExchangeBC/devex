'use strict';

import angular, { IPromise, uiNotification } from 'angular';
import _ from 'lodash';
import { ICapability } from '../../../capabilities/shared/ICapabilityDTO';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IPhase } from '../../shared/IOpportunityDTO';
import { IOpportunitiesService, IOpportunityResource } from './OpportunitiesService';

export interface IOpportunitiesCommonService {
	isWatching(opportunity: IOpportunityResource): boolean;
	addWatch(opportunity: IOpportunityResource): boolean;
	removeWatch(opportunity: IOpportunityResource): boolean;
	publishStatus(opportunity: IOpportunityResource): any[];
	requestApprovalCode(opportunity: IOpportunityResource): Promise<IOpportunityResource>;
	submitApprovalCode(opportunity: IOpportunityResource, submittedCode: string, action: string): IPromise<IOpportunityResource>;
	getTechnicalSkills(opportunity: IOpportunityResource): ICapabilitySkill[];
	getCapabilitiesForPhase(phase: IPhase): ICapability[];
}

class OpportunitiesCommonService implements IOpportunitiesCommonService {
	constructor(private AuthenticationService: IAuthenticationService, private OpportunitiesService: IOpportunitiesService, private Notification: uiNotification.INotificationService) {}

	// Check if the current user is currently watching this opportunity
	public isWatching(opportunity: IOpportunityResource): boolean {
		if (this.AuthenticationService.user) {
			return opportunity.watchers.map(user => user._id).indexOf(this.AuthenticationService.user._id) !== -1;
		} else {
			return false;
		}
	}

	// Add current user to the watchers list - this assumes that ths function could
	// not be run except if the user was not already on the list
	public addWatch(opportunity: IOpportunityResource): boolean {
		opportunity.watchers.push(this.AuthenticationService.user);
		this.OpportunitiesService.addWatch({
			opportunityId: opportunity._id
		});
		this.Notification.success({ message: '<i class="fas fa-eye"></i><br/><br/>You are now watching<br/>' + opportunity.name });
		return true;
	}

	// Remove the current user from the list
	public removeWatch(opportunity: IOpportunityResource): boolean {
		opportunity.watchers.splice(opportunity.watchers.indexOf(this.AuthenticationService.user), 1);
		this.OpportunitiesService.removeWatch({
			opportunityId: opportunity._id
		});
		this.Notification.success({ message: '<i class="fas fa-eye-slash"></i><br/><br/>You are no longer watching<br/>' + opportunity.name });
		return false;
	}

	// Checks for whether or not fields are missing and whether we can publish
	// TODO - this mess needs to be sorted out
	public publishStatus(opportunity: IOpportunityResource): any[] {
		const fields = {
			common: [
				[opportunity.name, 'Title'],
				[opportunity.description, 'Background / Summary'],
				[opportunity.github, 'Github Repository'],
				[opportunity.program, 'Program'],
				[opportunity.project, 'Project'],
				[opportunity.deadline, 'Proposal Deadline'],
				[opportunity.assignment, 'Assignment Date'],
				[opportunity.location, 'Location']
			],
			cwu: [
				[opportunity.evaluation, 'Proposal Evaluation Criteria'],
				[opportunity.criteria, 'Acceptance Criteria'],
				[opportunity.skills, 'Required Skills'],
				[opportunity.earn, 'Fixed-Price Reward'],
				[opportunity.start, 'Proposed Start Date']
			],
			swu: [
				[opportunity.budget > 0, 'Total Opportunity Budget'],
				[opportunity.phases.implementation.isImplementation || opportunity.phases.inception.isInception || opportunity.phases.proto.isPrototype, 'Phase Selection and Information'],
				[
					!opportunity.phases.implementation.isImplementation || (opportunity.phases.implementation.isImplementation && opportunity.phases.implementation.endDate),
					'Implementation Phase End Date'
				],

				[
					!opportunity.phases.implementation.isImplementation || (opportunity.phases.implementation.isImplementation && opportunity.phases.implementation.startDate),
					'Implementation Phase Start Date'
				],
				[!opportunity.phases.inception.isInception || (opportunity.phases.inception.isInception && opportunity.phases.inception.endDate), 'Inception Phase End Date'],
				[!opportunity.phases.inception.isInception || (opportunity.phases.inception.isInception && opportunity.phases.inception.startDate), 'Inception Phase Start Date'],
				[!opportunity.phases.proto.isPrototype || (opportunity.phases.proto.isPrototype && opportunity.phases.proto.endDate), 'Prototype Phase End Date'],
				[!opportunity.phases.proto.isPrototype || (opportunity.phases.proto.isPrototype && opportunity.phases.proto.startDate), 'Prototype Phase Start Date']
			]
		};

		const errorFields: any[] = fields.common.reduce((accum: any[], elem: any[]) => {
			if (!elem[0]) {
				accum.push(elem[1]);
			}
			return accum;
		}, []);

		const fieldSource = opportunity.opportunityTypeCd === 'code-with-us' ? fields.cwu : fields.swu;
		fieldSource.forEach((elem: any) => {
			if (!elem[0]) {
				errorFields.push(elem[1]);
			}
		});
		return errorFields;
	}

	// Request a 2FA authentication code to be sent to the designated contact in the opportunity approval info
	public async requestApprovalCode(opportunity: IOpportunityResource): Promise<IOpportunityResource> {
		const approvalInfo = opportunity.intermediateApproval.state === 'sent' ? opportunity.intermediateApproval : opportunity.finalApproval;
		if (approvalInfo.twoFASendCount < 5) {
			return await this.OpportunitiesService.requestCode({ opportunityId: opportunity.code }).$promise;
		} else {
			throw new Error('Number of sent codes exceeded');
		}
	}

	// Submit the passed approval code
	// Return a promise that will resolve for success, reject otherwise
	public submitApprovalCode(opportunity: IOpportunityResource, submittedCode: string, action: string): IPromise<IOpportunityResource> {
		const isPreApproval = opportunity.intermediateApproval.state === 'sent'; // Has intermediate approval been actioned or is still at 'sent state'?
		const approvalInfo = isPreApproval ? opportunity.intermediateApproval : opportunity.finalApproval;

		if (approvalInfo.twoFAAttemptCount < 5) {
			return this.OpportunitiesService.submitCode({
				opportunityId: opportunity.code,
				code: submittedCode,
				action: action.toLowerCase(),
				preapproval: isPreApproval.toString()
			}).$promise;
		} else {
			throw new Error('Maximum number of attempts reached');
		}
	}

	// Return a list of all technical skills for an opportunity
	// Merges and removes duplicates across phases
	public getTechnicalSkills(opportunity: IOpportunityResource): ICapabilitySkill[] {
		return _.unionWith(
			opportunity.phases.inception.capabilitySkills,
			opportunity.phases.proto.capabilitySkills,
			opportunity.phases.implementation.capabilitySkills,
			(a: any, b: any) => a.code === b.code
		);
	}

	// Return a list of required capabilities for the given phase
	// Each returned capabilitity in the list is marked with fullTime = true if
	// it is a core capability
	public getCapabilitiesForPhase(phase: IPhase): ICapability[] {
		const coreCodes = phase.capabilitiesCore.map(cap => {
			return cap.code;
		});

		phase.capabilities.forEach(cap => {
			if (coreCodes.indexOf(cap.code) !== -1) {
				cap.fullTime = true;
			}
		});

		return phase.capabilities;
	}
}

angular.module('opportunities.services').factory('OpportunitiesCommonService', [
	'AuthenticationService',
	'OpportunitiesService',
	'Notification',
	(AuthenticationService: IAuthenticationService, OpportunitiesService: IOpportunitiesService, Notification: uiNotification.INotificationService): IOpportunitiesCommonService => {
		return new OpportunitiesCommonService(AuthenticationService, OpportunitiesService, Notification);
	}
]);
