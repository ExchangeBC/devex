'use strict';

// Import certain style elements here so that webpack picks them up
import { StateService } from '@uirouter/core';
import angular, { IController, IFormController, IRootScopeService, uiNotification } from 'angular';
import _ from 'lodash';
import moment from 'moment';
import { ICapabilitiesService, ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapabilitySkillResource } from '../../../capabilities/client/services/CapabilitiesSkillsService';
import { IProject } from '../../../projects/shared/IProjectDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IPhase, ITeamQuestion } from '../../shared/IOpportunityDTO';
import '../css/opportunities.css';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export class OpportunityEditSWUController implements IController {
	public static $inject = [
		'$scope',
		'$state',
		'opportunity',
		'editing',
		'projects',
		'AuthenticationService',
		'Notification',
		'DataService',
		'ask',
		'CapabilitiesService',
		'TinyMceConfiguration',
		'OpportunitiesService'
	];

	public isUser: boolean;
	public isAdmin: boolean;
	public isGov: boolean;
	public closing: string;
	public cities: string[];
	public projectLink: boolean;
	public opportunityForm: IFormController;
	public allCapabilities: ICapabilityResource[];
	public activeTab = 0;
	public editAddendumIndex: number;
	public editingAddenda: boolean;
	public editingQuestion: boolean;
	public editQuestionIndex: number;

	private codeChallengeDefaultWeight = 0.35;
	private skillDefaultWeight = 0.05;
	private questionDefaultWeight = 0.25;
	private interviewDefaultWeight = 0.25;
	private priceDefaultWeight = 0.1;
	private questionBackup: ITeamQuestion;

	constructor(
		private $scope: IRootScopeService,
		private $state: StateService,
		public opportunity: IOpportunityResource,
		private editing: boolean,
		public projects: IProject[],
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private DataService,
		private ask,
		private CapabilitiesService: ICapabilitiesService,
		public TinyMceConfiguration,
		private OpportunitiesService: IOpportunitiesService
	) {
		this.toggleSelectedSkill = this.toggleSelectedSkill.bind(this);

		this.isUser = !!this.AuthenticationService.user;
		this.isAdmin = this.isUser && this.AuthenticationService.user.roles.indexOf('admin') !== -1;
		this.isGov = this.isUser && this.AuthenticationService.user.roles.indexOf('gov') !== -1;

		this.closing = 'CLOSED';
		this.cities = this.DataService.cities;

		if (!this.editing) {
			this.populateNewOpportunity();
		} else {
			this.refreshOpportunity(this.opportunity);
		}
	}

	// save the opportunity, could be added or edited (post or put)
	public async save(isValid: boolean): Promise<void> {
		if (!this.opportunity.name) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> You must enter a title for your opportunity"
			});
			this.activeTab = 0;
			return;
		}

		// validate the budget and phase cost maximums
		if (!this.validateBudget()) {
			this.activeTab = 5;
			return;
		}

		// ensure weights are valid
		const totalScore = this.addWeights();
		if (totalScore !== 100) {
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> Please ensure the score weighting totals 100%"
			});
			this.activeTab = 9;
			return;
		}

		// validate the entire form
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.opportunityForm');
			this.Notification.error({
				title: 'Error',
				message: "<i class='fas fa-exclamation-triangle'></i> There are errors on the page, please review your work and re-save"
			});
			return;
		}

		// ensure that there is a trailing '/' on the github field
		if (this.opportunity.github && this.opportunity.github.substr(-1, 1) !== '/') {
			this.opportunity.github += '/';
		}

		// ensure all times are set to 1600
		this.setTimes(this.opportunity, 16, 0, 0);

		// if this is a published opportunity, confirm save as this generates notifications
		if (this.opportunity.isPublished) {
			const question = 'Saving a published opportunity will notify subscribed users.  Proceed with save?';
			const choice = await this.ask.yesNo(question);
			if (!choice) {
				return;
			}
		}

		let updatedOpportunity: IOpportunityResource;
		try {
			if (this.editing) {
				updatedOpportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} else {
				updatedOpportunity = await this.OpportunitiesService.create(this.opportunity).$promise;
			}

			this.refreshOpportunity(updatedOpportunity);
			this.opportunityForm.$setPristine();

			let successMessage: string;
			if (this.opportunity.isPublished) {
				successMessage = '<i class="fas fa-check-circle"></i> Opportunity saved and subscribers notified';
			} else {
				successMessage = '<i class="fas fa-check-circle"></i> Opportunity saved';
			}

			this.Notification.success({
				message: successMessage
			});

			// if this is a new opportunity we just saved, transition to edit view
			if (!this.editing) {
				this.$state.go('opportunityadmin.editswu', { opportunityId: this.opportunity.code });
			}
		} catch (error) {
			this.handleError(error);
		}
	}

	// remove the opportunity with some confirmation
	public async remove(): Promise<void> {
		const question = 'Please confirm you want to delete this opportunity';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			try {
				await this.OpportunitiesService.remove({ opportunityId: this.opportunity.code }).$promise;

				this.$state.go('opportunities.list');
				this.Notification.success({
					message: '<i class="fas fa-check-circle"></i> Opportunity deleted'
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// Returns a boolean indicating whether the given phase is included in the opportunity or not
	public isPhaseIncluded(phase: IPhase): boolean {
		if (phase === this.opportunity.phases.inception) {
			return phase.isInception;
		} else if (phase === this.opportunity.phases.proto) {
			return phase.isPrototype;
		} else if (phase === this.opportunity.phases.implementation) {
			return phase.isImplementation;
		}
	}

	// Changes the given phase to be the start phase, and adjust the status of the other phases accordingly
	public changeToStartPhase(phase: IPhase): void {
		if (phase === this.opportunity.phases.inception) {
			this.opportunity.phases.inception.isInception = true;
			this.opportunity.phases.proto.isPrototype = true;
			this.opportunity.phases.implementation.isImplementation = true;
		} else if (phase === this.opportunity.phases.proto) {
			this.opportunity.phases.inception.isInception = false;

			this.opportunity.phases.inception.capabilities = [];
			this.opportunity.phases.inception.capabilitiesCore = [];
			this.opportunity.phases.inception.capabilitySkills = [];

			this.opportunity.phases.proto.isPrototype = true;
			this.opportunity.phases.implementation.isImplementation = true;
		} else if (phase === this.opportunity.phases.implementation) {
			this.opportunity.phases.inception.isInception = false;
			this.opportunity.phases.inception.capabilities = [];
			this.opportunity.phases.inception.capabilitiesCore = [];
			this.opportunity.phases.inception.capabilitySkills = [];

			this.opportunity.phases.proto.isPrototype = false;
			this.opportunity.phases.proto.capabilities = [];
			this.opportunity.phases.proto.capabilitiesCore = [];
			this.opportunity.phases.proto.capabilitySkills = [];

			this.opportunity.phases.implementation.isImplementation = true;
		}
	}

	// Returns boolean indicating whether the given capability is selected for the given phase (if one is given)
	// If no phase is provided, return boolean indicating whether capability is selected for any phase
	public isCapabilitySelected(capability: ICapabilityResource, phaseCapList?: ICapabilityResource[]): boolean {
		if (phaseCapList) {
			return phaseCapList.map(cap => cap.code).indexOf(capability.code) !== -1;
		} else {
			return (
				_.union(this.opportunity.phases.inception.capabilities, this.opportunity.phases.proto.capabilities, this.opportunity.phases.implementation.capabilities)
					.map(cap => cap.code)
					.indexOf(capability.code) !== -1
			);
		}
	}

	// Returns boolean indicating whether the given skill is a selected preferred skill or not
	public isSkillSelected(skill: ICapabilitySkillResource): boolean {
		return (
			_.union(this.opportunity.phases.inception.capabilitySkills, this.opportunity.phases.proto.capabilitySkills, this.opportunity.phases.implementation.capabilitySkills)
				.map(sk => sk.code)
				.indexOf(skill.code) !== -1
		);
	}

	// Toggles the selection for the given capability for the given phase by adding it or removing it from list for that phase
	public toggleSelectedCapability(capability: ICapabilityResource, phaseCapList: ICapabilityResource[]): void {
		// If the phase contains the capability, remove it, otherwise, add it in
		if (this.isCapabilitySelected(capability, phaseCapList)) {
			_.remove(phaseCapList, cap => cap.code === capability.code);

			// remove the skills from the corresponding phase skill list
			if (phaseCapList === this.opportunity.phases.inception.capabilities) {
				this.opportunity.phases.inception.capabilitySkills = [];
			} else if (phaseCapList === this.opportunity.phases.proto.capabilities) {
				this.opportunity.phases.proto.capabilitySkills = [];
			} else if (phaseCapList === this.opportunity.phases.implementation.capabilities) {
				this.opportunity.phases.implementation.capabilitySkills = [];
			}
		} else {
			phaseCapList.push(capability);
		}
	}

	public toggleSelectedSkill(skill: ICapabilitySkillResource): void {
		// If it's selected, remove it from all lists
		if (this.isSkillSelected(skill)) {
			_.remove(this.opportunity.phases.inception.capabilitySkills, sk => sk.code === skill.code);
			_.remove(this.opportunity.phases.proto.capabilitySkills, sk => sk.code === skill.code);
			_.remove(this.opportunity.phases.implementation.capabilitySkills, sk => sk.code === skill.code);
		} else {
			// Find the capability the skill belongs to
			const parentCap = this.allCapabilities.find(cap => {
				return cap.skills.map(sk => sk.code).indexOf(skill.code) !== -1;
			});

			// Find the phases where the parent capability is selected and add it to the corresponding skill list for that phase
			if (this.opportunity.phases.inception.capabilities.map(cap => cap.code).indexOf(parentCap.code) !== -1) {
				this.opportunity.phases.inception.capabilitySkills.push(skill);
			}

			if (this.opportunity.phases.proto.capabilities.map(cap => cap.code).indexOf(parentCap.code) !== -1) {
				this.opportunity.phases.proto.capabilitySkills.push(skill);
			}

			if (this.opportunity.phases.implementation.capabilities.map(cap => cap.code).indexOf(parentCap.code) !== -1) {
				this.opportunity.phases.implementation.capabilitySkills.push(skill);
			}
		}
	}

	// Adding a new team question
	// We add new one to the list and enter edit mode
	public addNewTeamQuestion(): void {
		// no existing questin to store since this is a new question
		this.questionBackup = null;

		this.opportunity.teamQuestions.push({
			question: '',
			guideline: '',
			wordLimit: 300,
			questionScore: 5
		});

		// set the current question being edited to the last one just added
		this.editQuestionIndex = this.opportunity.teamQuestions.length - 1;
		this.editingQuestion = true;
	}

	// Cancel edit team question
	public cancelEditTeamQuestion(): void {
		if (this.editingQuestion) {
			// if no backup, then this was new question, so remove
			if (this.questionBackup === null) {
				this.opportunity.teamQuestions.pop();
			} else {
				this.opportunity.teamQuestions[this.editQuestionIndex] = this.questionBackup;
				this.questionBackup = null;
			}
			this.editingQuestion = false;
		}
	}

	// Enter edit mode for an existing team question
	public editTeamQuestion(index: number): void {
		// store a copy in the event of a cancel
		this.questionBackup = angular.copy(this.opportunity.teamQuestions[index]);

		// enter edit mode on the specified questino
		this.editQuestionIndex = index;
		this.editingQuestion = true;
	}

	// Save edit team question
	public saveEditTeamQuestion(): void {
		this.editingQuestion = false;
		this.questionBackup = null;
	}

	// Delete team question with confirm modal
	public async deleteTeamQuestion(index: number): Promise<void> {
		const question = 'Are you sure you wish to delete this team question from the opportunity?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			this.opportunity.teamQuestions.splice(index, 1);
		}
	}

	// Adding a new addendum
	// We add a new one to the list and enter edit mode
	public addNewAddendum(): void {
		this.opportunity.addenda.push({
			description: '',
			createdBy: this.AuthenticationService.user,
			createdOn: new Date()
		});

		this.editingAddenda = true;
		this.editAddendumIndex = this.opportunity.addenda.length - 1;
	}

	// Cancel edit addendum
	public cancelEditAddendum(): void {
		if (this.editingAddenda) {
			this.opportunity.addenda.pop();
			this.editingAddenda = false;
		}
	}

	// Save the addendum being edited (just exit edit mode)
	public saveEditAddendum(): void {
		this.editingAddenda = false;
	}

	// Delete an addendum with confirm modal
	public async deleteAddenda(index: number): Promise<void> {
		const question = 'Are you sure you wish to delete this addendum?';
		const choice = await this.ask.yesNo(question);
		if (choice) {
			this.opportunity.addenda.splice(index, 1);
		}
	}

	public updateProgramProject(): void {
		this.opportunity.program = this.opportunity.project.program;
	}

	// Adds up the input weights and returns as a percentage
	public addWeights(): number {
		return Math.ceil(
			(this.opportunity.weights.skill + this.opportunity.weights.question + this.opportunity.weights.codechallenge + this.opportunity.weights.interview + this.opportunity.weights.price) * 100
		);
	}

	private populateNewOpportunity(): void {
		this.opportunity.opportunityTypeCd = 'sprint-with-us';

		// Initialize phases for new opportunities
		this.opportunity.phases = {
			implementation: {
				isImplementation: true,
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date()
			},
			inception: {
				isInception: true,
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date()
			},
			proto: {
				isPrototype: true,
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date()
			},
			aggregate: {
				capabilities: [],
				capabilitiesCore: [],
				capabilitySkills: [],
				startDate: new Date(),
				endDate: new Date()
			}
		};

		// Initialize default weights for new opportunities
		if (!this.opportunity.weights) {
			this.opportunity.weights = {
				codechallenge: this.codeChallengeDefaultWeight,
				skill: this.skillDefaultWeight,
				question: this.questionDefaultWeight,
				interview: this.interviewDefaultWeight,
				price: this.priceDefaultWeight
			};
		}

		// Initialize addenda
		this.opportunity.addenda = [];

		// Initialize team questions
		this.opportunity.teamQuestions = [];

		// Initialize default dates
		this.opportunity.deadline = new Date();
		this.opportunity.assignment = new Date();
		this.opportunity.start = new Date();
		this.opportunity.endDate = new Date();

		// We don't have a project to link to yet, so show select input
		this.projectLink = false;

		// Refresh the capabilities
		this.refreshCapabilities();
	}

	// Load the current opportunity into the view
	private refreshOpportunity(newOpportunity: IOpportunityResource): void {
		// If the user doesn't have the right access then kick them out
		if (this.editing && !this.isAdmin && !newOpportunity.userIs.admin) {
			this.$state.go('forbidden');
		}

		this.opportunity = newOpportunity;

		// Format strings into dates so Angular doesn't complain
		this.opportunity.deadline = new Date(this.opportunity.deadline);
		this.opportunity.assignment = new Date(this.opportunity.assignment);
		this.opportunity.start = new Date(this.opportunity.start);
		this.opportunity.endDate = new Date(this.opportunity.endDate);
		this.opportunity.phases.inception.startDate = new Date(this.opportunity.phases.inception.startDate);
		this.opportunity.phases.inception.endDate = new Date(this.opportunity.phases.inception.endDate);
		this.opportunity.phases.proto.startDate = new Date(this.opportunity.phases.proto.startDate);
		this.opportunity.phases.proto.endDate = new Date(this.opportunity.phases.proto.endDate);
		this.opportunity.phases.implementation.startDate = new Date(this.opportunity.phases.implementation.startDate);
		this.opportunity.phases.implementation.endDate = new Date(this.opportunity.phases.implementation.endDate);

		// Update closing flag
		this.closing = this.opportunity.deadline.getTime() - new Date().getTime() > 0 ? 'OPEN' : 'CLOSED';

		// Link to the opportunities project
		this.projectLink = true;

		// Refresh the capabilities
		this.refreshCapabilities();
	}

	private refreshCapabilities(): void {
		// Retrieve a list of the complete capability set available
		this.allCapabilities = this.CapabilitiesService.list();
	}

	// Set the times on the opportunity dates to a specified time
	private setTimes(opportunity: IOpportunityResource, hour: number, minute: number, second: number) {
		opportunity.deadline = moment(opportunity.deadline)
			.set({ hour, minute, second })
			.toDate();

		opportunity.assignment = moment(opportunity.assignment)
			.set({ hour, minute, second })
			.toDate();

		opportunity.endDate = moment(opportunity.endDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.implementation.endDate = moment(opportunity.phases.implementation.endDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.implementation.startDate = moment(opportunity.phases.implementation.startDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.inception.endDate = moment(opportunity.phases.inception.endDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.inception.startDate = moment(opportunity.phases.inception.startDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.proto.endDate = moment(opportunity.phases.proto.endDate)
			.set({ hour, minute, second })
			.toDate();

		opportunity.phases.proto.startDate = moment(opportunity.phases.proto.startDate)
			.set({ hour, minute, second })
			.toDate();
	}

	private validateBudget() {
		if (this.opportunity.budget > 2000000) {
			this.Notification.error({
				message: 'You cannot enter an overall budget greater than $2,000,000',
				title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
			});
			return false;
		}

		if (this.opportunity.phases.inception.isInception && this.opportunity.phases.inception.maxCost > this.opportunity.budget) {
			this.Notification.error({
				message: 'You cannot enter an Inception budget greater than the total budget.',
				title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
			});
			return false;
		}

		if (this.opportunity.phases.proto.isPrototype && this.opportunity.phases.proto.maxCost > this.opportunity.budget) {
			this.Notification.error({
				message: 'You cannot enter a Proof of Concept budget greater than the total budget.',
				title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
			});
			return false;
		}

		if (this.opportunity.phases.implementation.maxCost > this.opportunity.budget) {
			this.Notification.error({
				message: 'You cannot enter an Implementation budget greater than the total budget.',
				title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
			});
			return false;
		}

		return true;
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('opportunities').controller('OpportunityEditSWUController', OpportunityEditSWUController);
