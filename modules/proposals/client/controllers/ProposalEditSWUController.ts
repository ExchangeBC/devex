'use strict';

import angular, { angularFileUpload, IFormController, IWindowService, uiNotification } from 'angular';
import { IStateService } from 'angular-ui-router';
import _ from 'lodash';
import ICapabilityDocument from '../../../capabilities/server/interfaces/ICapabilityDocument';
import ICapabilitySkillDocument from '../../../capabilities/server/interfaces/ICapabilitySkillDocument';
import { IOpportunityResource } from '../../../opportunities/client/services/OpportunitiesService';
import AuthenticationService from '../../../users/client/services/AuthenticationService';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';
import ProposalService, { IProposalResource } from '../services/ProposalService';

export default class ProposalEditSWUController {
	public static $inject = [
		'editing',
		'ask',
		'Upload',
		'$state',
		'proposal',
		'opportunity',
		'authenticationService',
		'proposalService',
		'Notification',
		'org',
		'TINYMCE_OPTIONS',
		'resources',
		'$window'
	];

	public title: string;
	public user: IUserDocument;
	public proposalForm: IFormController;
	public activeTab: number;
	public termsDownloaded: boolean;

	public inceptionSearchBox: string;
	public prototypeSearchBox: string;
	public implementationSearchBox: string;

	public filteredInceptionMembers: IUserDocument[];
	public filteredPrototypeMembers: IUserDocument[];
	public filteredImplementationMembers: IUserDocument[];

	public teamsAccordianCollapsed = false;
	public priceAccordianCollapsed = false;
	public questionsAccordianCollapsed = false;
	public referencesAccordianCollapsed = false;

	constructor(
		public editing: boolean,
		private ask,
		private Upload: angularFileUpload.IUploadService,
		private $state: IStateService,
		public proposal: IProposalResource,
		public opportunity: IOpportunityResource,
		private authenticationService: AuthenticationService,
		private proposalService: ProposalService,
		private Notification: uiNotification.INotificationService,
		public org,
		public TINYMCE_OPTIONS,
		public resources: any,
		private $window: IWindowService
	) {
		this.user = this.authenticationService.user;
		this.activeTab = 1;
		this.filteredInceptionMembers = [];
		this.filteredPrototypeMembers = [];
		this.filteredImplementationMembers = [];
		this.refreshProposal(this.proposal);
	}

	public downloadTermsClicked() {
		this.proposal.isAcceptedTerms = true;
	}

	public formatDate(date: Date | string): string {
		const dateObj = date instanceof Date ? date : new Date(date);
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = dateObj.getDate();
		const monthIndex = dateObj.getMonth();
		const year = dateObj.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', ' + year;
	}

	public filterMembers(completeList: IUserDocument[], filteredList: IUserDocument[], selectedTeam: IUserDocument[], filter: string): void {
		filteredList.splice(0, filteredList.length);
		completeList.forEach(member => {
			if (!filter || filter.length === 0 || member.displayName.toLowerCase().includes(filter.toLowerCase()) || selectedTeam.indexOf(member) !== -1) {
				filteredList.push(member);
			}
		});
	}

	public clickMember(member: IUserDocument, team: IUserDocument[]): void {
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

	public teamHasMember(team: IUserDocument[], member: IUserDocument): boolean {
		return team.map(mem => mem._id).indexOf(member._id) !== -1;
	}

	public teamHasCapability(team: IUserDocument[], capability: ICapabilityDocument) {
		const found = team.find(member => {
			return member.capabilities.map(cap => cap._id).indexOf(capability._id) !== -1;
		});

		return !!found;
	}

	public teamHasSkill(team: IUserDocument[], skill: ICapabilitySkillDocument) {
		const found = team.find(member => {
			return member.capabilitySkills.map(sk => sk._id).indexOf(skill._id) !== -1;
		});

		return !!found;
	}

	public isFullTime(coreCapabilities: ICapabilityDocument[], capability: ICapabilityDocument) {
		return coreCapabilities.map(cap => cap._id).indexOf(capability._id) !== -1;
	}

	public validatePhaseAmount(cost: number, maxPhaseAmount: number): boolean {
		return cost >= 0 && cost <= maxPhaseAmount;
	}

	public validateEntireAmount(): boolean {
		return this.proposal.phases.inception.cost + this.proposal.phases.proto.cost + this.proposal.phases.implementation.cost <= this.opportunity.budget;
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
		if (!successMessage) {
			successMessage = 'Changes saved';
		}

		try {
			let updatedProposal: IProposalResource;
			if (this.editing) {
				updatedProposal = await this.proposalService.getProposalResourceClass().update(this.proposal).$promise;
			} else {
				updatedProposal = await this.proposalService.getProposalResourceClass().create(this.proposal).$promise;
			}
			this.refreshProposal(updatedProposal);
			this.Notification.success({
				title: 'Success',
				message: `<i class="fas fa-check-circle"></i> ${successMessage}`
			});
		} catch (error) {
			this.handleError(error);
		}
	}

	public withdraw() {
		this.proposal.status = 'Draft';
		this.save('Your proposal has been withdrawn');
	}

	// submit the proposal
	public async submit(): Promise<void> {
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
		if (!this.proposal.isAcceptedTerms || !this.isTeamCapable() || !this.org.metRFQ) {
			this.Notification.error({
				message: 'Please ensure you have met the RFQ.  The Terms & Conditions must be accepted and your selected team members must meet all capabilities',
				title: 'Error',
				delay: 6000
			});
			return;
		}

		this.proposal.status = 'Submitted';
		await this.save('Your proposal has been submitted');
		this.close();
	}

	// delete the proposal with confirmation
	public async delete(): Promise<void> {
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
		const updatedProposal = await this.proposalService.getProposalResourceClass().removeDoc({
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

	private isTeamCapable(): boolean {
		const teamInceptionCapabilities = _.uniqWith(_.flatten(this.proposal.phases.inception.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);
		const teamPrototypeCapabilities = _.uniqWith(_.flatten(this.proposal.phases.proto.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);
		const teamImplementationCapabilities = _.uniqWith(_.flatten(this.proposal.phases.implementation.team.map(member => member.capabilities)), (cap1, cap2) => cap1._id === cap2._id);

		const inceptionCapsMissing = _.differenceWith(this.opportunity.phases.inception.capabilities, teamInceptionCapabilities, (cap1, cap2) => cap1._id === cap2._id);
		const protoCapsMissing = _.differenceWith(this.opportunity.phases.proto.capabilities, teamPrototypeCapabilities, (cap1, cap2) => cap1._id === cap2._id);
		const implementationCapsMissing = _.differenceWith(this.opportunity.phases.implementation.capabilities, teamImplementationCapabilities, (cap1, cap2) => cap1._id === cap2._id);

		return inceptionCapsMissing.length === 0 && protoCapsMissing.length === 0 && implementationCapsMissing.length === 0;
	}

	private refreshProposal(newProposal: IProposalResource): void {
		this.proposal = newProposal;
		this.title = this.editing ? 'Edit' : 'Create';
		this.setupQuestions();
	}

	private setupQuestions(): void {
		if (!this.proposal.teamQuestionResponses || this.proposal.teamQuestionResponses.length === 0) {
			this.proposal.teamQuestionResponses = [];
		}

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

	private handleError(error: any): void {
		const errorMessage = (error as any).data ? (error as any).data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('proposals').controller('ProposalEditSWUController', ProposalEditSWUController);
