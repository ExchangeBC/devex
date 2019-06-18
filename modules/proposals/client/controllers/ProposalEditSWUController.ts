'use strict';

import { StateService } from '@uirouter/core';
import angular, { angularFileUpload, IFormController, IWindowService, uiNotification } from 'angular';
import _ from 'lodash';
import moment from 'moment-timezone';
import { Settings } from 'tinymce';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapabilitySkillResource } from '../../../capabilities/client/services/CapabilitiesSkillsService';
import { IOpportunitiesService, IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import { IOrgCommonService } from '../../../orgs/client/services/OrgCommonService';
import { IOrgResource } from '../../../orgs/client/services/OrgService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IProposalResource, IProposalService } from '../services/ProposalService';

export default class ProposalEditSWUController {
	public static $inject = [
		'editing',
		'ask',
		'Upload',
		'$state',
		'proposal',
		'opportunity',
		'AuthenticationService',
		'ProposalService',
		'Notification',
		'org',
		'TinyMceConfiguration',
		'resources',
		'$window',
		'OrgCommonService',
		'OpportunitiesService'
	];

	public title: string;
	public user: IUser;
	public proposalForm: IFormController;
	public activeTab: number;
	public termsDownloaded: boolean;

	public inceptionSearchBox: string;
	public prototypeSearchBox: string;
	public implementationSearchBox: string;

	public filteredInceptionMembers: IUser[];
	public filteredPrototypeMembers: IUser[];
	public filteredImplementationMembers: IUser[];

	public teamsAccordianCollapsed = false;
	public priceAccordianCollapsed = false;
	public questionsAccordianCollapsed = false;
	public referencesAccordianCollapsed = false;

	constructor(
		public editing: boolean,
		private ask,
		private Upload: angularFileUpload.IUploadService,
		private $state: StateService,
		public proposal: IProposalResource,
		public opportunity: IOpportunityResource,
		private AuthenticationService: IAuthenticationService,
		private ProposalService: IProposalService,
		private Notification: uiNotification.INotificationService,
		public org: IOrgResource,
		public TinyMceConfiguration: Settings,
		public resources: any,
		private $window: IWindowService,
		private OrgCommonService: IOrgCommonService,
		private OpportunitiesService: IOpportunitiesService
	) {
		this.user = this.AuthenticationService.user;
		this.activeTab = 1;
		this.filteredInceptionMembers = [];
		this.filteredPrototypeMembers = [];
		this.filteredImplementationMembers = [];

		if (!this.editing) {
			this.populateNewProposal();
		} else {
			this.refreshProposal(this.proposal);
		}
	}

	public downloadTermsClicked() {
		this.termsDownloaded = true;
	}

	// Format dates to always be in PST (America/Vancouver timezone)
	public formatDate(date: string, includeTime: boolean): string {
		const momentDate = moment(date);
		const dateFormat = includeTime ? 'MMMM Do YYYY, HH:mm z' : 'MMMM Do YYYY';
		return momentDate.tz('America/Vancouver').format(dateFormat);
	}

	public filterMembers(completeList: IUser[], filteredList: IUser[], selectedTeam: IUser[], filter: string): void {
		filteredList.splice(0, filteredList.length);
		completeList.forEach(member => {
			if (!filter || filter.length === 0 || member.displayName.toLowerCase().includes(filter.toLowerCase()) || selectedTeam.indexOf(member) !== -1) {
				filteredList.push(member);
			}
		});
	}

	public clickMember(member: IUser, team: IUser[]): void {
		if (team.map(mem => mem._id).indexOf(member._id) === -1) {
			team.push(member);
		} else {
			for (let i = 0; i < team.length; i++) {
				if (team[i]._id === member._id) {
					team.splice(i, 1);
				}
			}
		}
	}

	public teamHasMember(team: IUser[], member: IUser): boolean {
		return team.map(mem => mem._id).indexOf(member._id) !== -1;
	}

	public teamHasCapability(team: IUser[], capability: ICapabilityResource) {
		const found = team.find(member => {
			return member.capabilities.map(cap => cap._id).indexOf(capability._id) !== -1;
		});

		return !!found;
	}

	public teamHasSkill(team: IUser[], skill: ICapabilitySkillResource) {
		const found = team.find(member => {
			return member.capabilitySkills.map(sk => sk._id).indexOf(skill._id) !== -1;
		});

		return !!found;
	}

	public isFullTime(coreCapabilities: ICapabilityResource[], capability: ICapabilityResource) {
		return coreCapabilities.map(cap => cap._id).indexOf(capability._id) !== -1;
	}

	public validatePhaseAmount(cost: number, maxPhaseAmount: number): boolean {
		return cost >= 0 && cost <= maxPhaseAmount;
	}

	public validateEntireAmount(): boolean {
		return this.proposal.phases.inception.cost + this.proposal.phases.proto.cost + this.proposal.phases.implementation.cost <= this.opportunity.budget;
	}

	public hasMetRFQ(): boolean {
		return this.OrgCommonService.hasOrgMetRFQ(this.org);
	}

	public validateAllAmounts(): boolean {
		return (
			this.validateEntireAmount() &&
			this.validatePhaseAmount(this.proposal.phases.inception.cost, this.opportunity.phases.inception.maxCost) &&
			this.validatePhaseAmount(this.proposal.phases.proto.cost, this.opportunity.phases.proto.maxCost) &&
			this.validatePhaseAmount(this.proposal.phases.implementation.cost, this.opportunity.phases.implementation.maxCost)
		);
	}

	// Close the proposal without saving
	public close(): void {
		this.$state.go('opportunities.viewswu', { opportunityId: this.opportunity.code });
	}

	// perform the save, both user info and proposal info
	public async save(successMessage?: string): Promise<void> {
		if (!(await this.checkDeadline())) {
			return;
		}

		if (!successMessage) {
			successMessage = 'Changes saved';
		}

		this.syncBusinessInformation();

		try {
			let updatedProposal: IProposalResource;
			if (this.editing) {
				updatedProposal = await this.ProposalService.update(this.proposal).$promise;
				this.refreshProposal(updatedProposal);
			} else {
				updatedProposal = await this.ProposalService.create(this.proposal).$promise;
				this.$state.go('proposaladmin.editswu', { proposalId: updatedProposal._id, opportunityId: this.opportunity._id });
			}

			this.Notification.success({
				message: `<i class="fas fa-check-circle"></i> ${successMessage}`
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	public async withdraw(): Promise<void> {
		if (await this.checkDeadline()) {
			this.proposal.status = 'Draft';
			this.save('Your proposal has been withdrawn');
		}
	}

	// submit the proposal
	public async submit(): Promise<void> {
		if (!(await this.checkDeadline())) {
			return;
		}

		// validate the phase and total amounts
		if (!this.validateAllAmounts()) {
			this.Notification.error({
				title: 'Error',
				message: 'Invalid price estimates entered'
			});
			this.activeTab = 4;
			window.scrollTo(0, 0);
			return;
		}

		// validate word counts on question responses
		let invalidResponseIndex = 0;
		this.$window.tinymce.editors.forEach((editor: any, index: number) => {
			if (editor.plugins.wordcount.getCount() > this.opportunity.teamQuestions[index].wordLimit) {
				this.Notification.error({
					message: `Word count exceeded for Question ${index + 1}.  Please edit your response before submitting`,
					title: 'Error'
				});
				invalidResponseIndex = index + 1;
			}
		});

		if (invalidResponseIndex > 0) {
			this.activeTab = 5;
			window.scrollTo(0, 0);
			return;
		}

		// ensure that proposal has met all the criteria for submission
		if (!this.OrgCommonService.hasOrgMetRFQ(this.org) || !this.isTeamCapable()) {
			this.Notification.error({
				message: 'Please ensure you have met the RFQ.  The Terms & Conditions must be accepted and your selected team members must meet all capabilities',
				title: 'Error',
				delay: 6000
			});
			return;
		}

		this.syncBusinessInformation();

		try {
			await this.ProposalService.submit(this.proposal).$promise;
			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Your proposal has been submitted'
			});
			this.close();
		} catch (error) {
			this.handleError(error);
		}
	}

	// delete the proposal with confirmation
	public async delete(): Promise<void> {
		if (!(await this.checkDeadline())) {
			return;
		}

		const question = 'Are you sure you want to permanently delete your proposal?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				await this.proposal.$remove();
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Proposal deleted'
				});
				this.$state.go('opportunities.viewswu', { opportunityId: this.opportunity.code });
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// upload documents
	public async upload(file: File): Promise<void> {
		if (!(await this.checkDeadline())) {
			return;
		}

		if (!file) {
			return;
		}

		if (file.size > 3 * 1024 * 1024) {
			this.Notification.error({
				delay: 6000,
				title: 'Error',
				message: 'This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image'
			});
			return;
		} else {
			try {
				const response = await this.Upload.upload({
					method: 'POST',
					url: '/api/proposals/' + this.proposal._id + '/documents',
					data: {
						file
					}
				});

				this.refreshProposal(response.data as IProposalResource);
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Attachment Uploaded'
				});
				return;
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async deletefile(fileId: string): Promise<void> {
		if (!(await this.checkDeadline())) {
			return;
		}

		const updatedProposal = await this.ProposalService.removeDoc({
			proposalId: this.proposal._id,
			documentId: fileId
		}).$promise;

		this.refreshProposal(updatedProposal);
		this.Notification.success({
			message: '<i class="fas fa-check-circle"></i> Attachment Removed'
		});
	}

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

	public toggleGuidance(index: number): void {
		this.opportunity.teamQuestions[index].showGuidance = !this.opportunity.teamQuestions[index].showGuidance;
	}

	private async checkDeadline(): Promise<boolean> {
		// Check with server to ensure deadline hasn't passed
		const response = await this.OpportunitiesService.getDeadlineStatus({ opportunityId: this.opportunity._id }).$promise;
		if (response.deadlineStatus === 'CLOSED') {
			this.Notification.error({
				title: 'Error',
				message: '<i class="fas fa-exclamation-triangle"></i> Deadline has passed!'
			});
			return false;
		} else {
			return true;
		}
	}

	private isTeamCapable(): boolean {
		const teamInceptionCapabilities = _.uniqWith(_.flatten(this.proposal.phases.inception.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);
		const teamPrototypeCapabilities = _.uniqWith(_.flatten(this.proposal.phases.proto.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);
		const teamImplementationCapabilities = _.uniqWith(_.flatten(this.proposal.phases.implementation.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);

		const inceptionCapsMissing = _.differenceWith(this.opportunity.phases.inception.capabilities, teamInceptionCapabilities, (cap1, cap2) => cap1._id === cap2._id);
		const protoCapsMissing = _.differenceWith(this.opportunity.phases.proto.capabilities, teamPrototypeCapabilities, (cap1, cap2) => cap1._id === cap2._id);
		const implementationCapsMissing = _.differenceWith(this.opportunity.phases.implementation.capabilities, teamImplementationCapabilities, (cap1, cap2) => cap1._id === cap2._id);

		return inceptionCapsMissing.length === 0 && protoCapsMissing.length === 0 && implementationCapsMissing.length === 0;
	}

	private populateNewProposal(): void {
		this.proposal.phases = {
			inception: {
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date(),
				team: []
			},
			proto: {
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date(),
				team: []
			},
			implementation: {
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date(),
				team: []
			},
			aggregate: {
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date(),
				team: []
			}
		};

		this.proposal.teamQuestionResponses = [];
		this.title = 'Create';
		this.proposal.status = 'New';
		this.proposal.opportunity = this.opportunity;
		this.proposal.user = this.user;
	}

	private refreshProposal(newProposal: IProposalResource): void {
		this.proposal = newProposal;
		this.title = 'Edit';
		this.setupQuestions();
	}

	private setupQuestions(): void {
		this.opportunity.teamQuestions.forEach((teamQuestion, index) => {
			teamQuestion.showGuidance = true;

			if (!this.proposal.teamQuestionResponses[index]) {
				this.proposal.teamQuestionResponses[index] = {
					question: teamQuestion.question,
					response: '',
					rank: 0,
					rejected: false,
					score: 0,
					displayInSummary: false
				};
			}
		});
	}

	private syncBusinessInformation(): void {
		this.proposal.org = this.org;
		this.proposal.businessName = this.org.name;
		this.proposal.businessAddress = this.org.fullAddress;
		this.proposal.businessContactName = this.org.contactName;
		this.proposal.businessContactEmail = this.org.contactEmail;
		this.proposal.businessContactPhone = this.org.contactPhone;
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('proposals').controller('ProposalEditSWUController', ProposalEditSWUController);
