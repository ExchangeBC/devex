'use strict';

import angular, { IController, IScope, ui, uiNotification } from 'angular';
import _ from 'lodash';
import { ICapabilitySkill } from '../../../capabilities/shared/ICapabilitySkillDTO';
import { IProposalResource, IProposalService } from '../../../proposals/client/services/ProposalService';
import { IProposal, ITeamQuestionResponse } from '../../../proposals/shared/IProposalDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { ITeamQuestion } from '../../shared/IOpportunityDTO';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

interface IEvaluationScope extends IScope {
	opportunity: IOpportunityResource;
}

interface IEvalModalScope {
	proposals: IProposalResource[];
	maxPoints: number;
	cancel(): void;
	save(): Promise<void>;
}

enum Stages {
	NEW = 0,
	REVIEW,
	GRADE_TYPE,
	QUESTIONS_INIT,
	QUESTIONS_SAVED,
	CODE_SCORES,
	INTERVIEW_SCORES,
	PRICE,
	ASSIGNED,
	FAIL
}

enum GradingTypes {
	LINEAR = 'Linear',
	WEIGHTED = 'Weighted'
}

export class OpportunityEvaluationDirectiveController implements IController {
	public static $inject = ['$scope', 'AuthenticationService', 'Notification', 'ProposalService', 'ask', 'modalService', 'OpportunitiesService'];

	public opportunity: IOpportunityResource;
	public proposals: IProposalResource[];
	public isLoading: boolean;
	public user: IUser;
	public isAdmin: boolean;
	public canEdit: boolean;
	public stages = Stages;
	public gradingTypes = GradingTypes;
	public maximumScore = 100;

	private numberOfTeamsToScreen = 4;
	private maxScoreForWeightedQuestionGrading = 5;

	constructor(
		private $scope: IEvaluationScope,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService,
		private ProposalService: IProposalService,
		private ask: any,
		private modalService: any,
		private OpportunitiesService: IOpportunitiesService
	) {
		this.opportunity = $scope.opportunity;
		this.isLoading = true;
		this.user = this.AuthenticationService.user;
		this.isAdmin = this.user && this.user.roles.includes('admin');
		this.canEdit = this.user && (this.user.roles.includes(`${this.opportunity.code}-admin`) || this.isAdmin);

		this.initializeEvaluation();
	}

	public getTimeLeft(): string {
		const msPerDay = 86400000;
		const msPerHour = 3600000;
		const msPerMinute = 6000;
		const difference = new Date(this.opportunity.deadline).getTime() - new Date().getTime();
		if (difference > 0) {
			const diffDays = Math.floor(difference / msPerDay);
			const diffHours = Math.floor((difference % msPerDay) / msPerHour);
			const diffMinutes = Math.floor(((difference % msPerDay) % msPerHour) / msPerMinute);

			if (diffDays > 0) {
				return `${diffDays} days ${diffHours} hours ${diffMinutes} minutes`;
			} else if (diffHours > 0) {
				return `${diffHours} hours ${diffMinutes} minutes`;
			} else if (diffMinutes > 0) {
				return `${diffMinutes} minutes`;
			}
		} else {
			return 'CLOSED';
		}
	}

	// Open a modal for reviewing questions and possibly rejecting them
	// Allows for saving review state, and committing review state
	public async openQuestionReviewModal(): Promise<void> {
		interface IQuestionReviewModalScope {
			data: {
				questions: ITeamQuestion[];
				responses: Map<ITeamQuestion, ITeamQuestionResponse[]>;
				currentPage: number;
			};
			cancel(): void;
			save(): void;
			commit(): void;
			onRejectionChanged(question: ITeamQuestion, response: ITeamQuestionResponse): void;
		}

		// Show modal and store response
		const modalResponse = await this.modalService.showModal({
			size: 'md',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-question-vetting.html',
			windowClass: 'question-review-modal',
			controller: [
				'$scope',
				'$uibModalInstance',
				($scope: IQuestionReviewModalScope, $uibModalInstance: ng.ui.bootstrap.IModalInstanceService) => {
					const proposalsForReview = angular.copy(this.proposals);
					const responsePivot = this.buildQuestionPivot(this.opportunity, proposalsForReview, true);
					this.randomizeResponseOrder(responsePivot);

					$scope.data = {
						questions: Array.from(responsePivot.keys()),
						responses: responsePivot,
						currentPage: 1
					};

					$scope.cancel = (): void => {
						$uibModalInstance.close({});
					};

					$scope.save = (): void => {
						$uibModalInstance.close({
							action: 'save',
							reviewedProposals: proposalsForReview
						});
					};

					$scope.commit = async (): Promise<void> => {
						// Prompt user for confirmation before committing review
						const message = 'Are you sure you wish to commmit your validation? Ensure you have reviewed all questions.  This action cannot be undone.';
						const choice = await this.ask.yesNo(message);
						if (choice) {
							$uibModalInstance.close({
								action: 'commit',
								reviewedProposals: proposalsForReview
							});
						}
					};
				}
			]
		});

		// take appropriate action (saving or commiting and moving onto next stage)
		if (modalResponse.action === 'save') {
			try {
				this.proposals = await this.saveProposals(modalResponse.reviewedProposals);
			} catch (error) {
				this.handleError(error);
			}
		} else if (modalResponse.action === 'commit') {
			// recalculate rankings, move to next evaluation stage, save proposals and opp
			try {
				this.proposals = await this.saveProposals(modalResponse.reviewedProposals);
				this.opportunity.evaluationStage = this.stages.GRADE_TYPE;
				this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	/**
	 * Open up a modal for question ranking
	 * The modal allows questions to be comparatively ranked
	 */
	public async openQuestionRankingModal(): Promise<void> {
		let modalMarkupUrl: string;
		if (this.opportunity.teamQuestionGradingType === this.gradingTypes.LINEAR) {
			modalMarkupUrl = '/modules/opportunities/client/views/swu-opportunity-modal-eval-questions-linear.html';
		} else {
			modalMarkupUrl = '/modules/opportunities/client/views/swu-opportunity-modal-eval-questions-weighted.html';
		}

		interface IQuestionRankingModalScope {
			data: {
				questions: ITeamQuestion[];
				responses: Map<ITeamQuestion, ITeamQuestionResponse[]>;
				currentPage: number;
				selected: ITeamQuestionResponse;
				scoresValid: boolean;
			};
			pageChanged(): void;
			close(): void;
			save(): void;
			validateScores(): void;
			commit(): void;
			inserted(item: ITeamQuestionResponse, index: number): void;
			moved(question: ITeamQuestion, index: number): void;
		}

		const modalResponse = await this.modalService.showModal(
			{
				size: 'lg',
				windowClass: 'question-rank-modal',
				templateUrl: modalMarkupUrl,
				controller: [
					'$scope',
					'$uibModalInstance',
					($scope: IQuestionRankingModalScope, $uibModalInstance: ng.ui.bootstrap.IModalInstanceService) => {
						// make a copy of the proposals and build a pivot on it
						const proposalsToRank = angular.copy(this.proposals);
						const responsePivot = this.buildQuestionPivot(this.opportunity, proposalsToRank, false);

						// if this is the first view of the questions, randomize the order
						if (this.opportunity.evaluationStage === this.stages.QUESTIONS_INIT) {
							this.randomizeResponseOrder(responsePivot);
						} else {
							// otherwise sort based on existing rank
							for (const keyValuePair of responsePivot) {
								keyValuePair[1].sort((responseA, responseB) => responseA.rank - responseB.rank);
							}
						}

						let swap: number;
						const calcRanking = (): void => {
							for (const keyValuePair of responsePivot) {
								keyValuePair[1].forEach((response, idx) => {
									response.rank = idx + 1;
								});
							}
						};

						$scope.data = {
							questions: Array.from(responsePivot.keys()),
							responses: responsePivot,
							currentPage: 1,
							selected: null,
							scoresValid: false
						};

						$scope.pageChanged = (): void => {
							$scope.data.selected = null;
						};

						$scope.close = (): void => {
							$uibModalInstance.close({});
						};

						$scope.save = (): void => {
							calcRanking();

							$uibModalInstance.close({
								action: 'save',
								rankedProposals: proposalsToRank
							});
						};

						$scope.validateScores = (): void => {
							$scope.data.scoresValid = true;
							for (const value of responsePivot) {
								value[1].forEach(response => {
									if (response.score === undefined || response.score < 1 || response.score > this.maxScoreForWeightedQuestionGrading) {
										$scope.data.scoresValid = false;
									}
								});
							}
						};

						$scope.commit = async (): Promise<void> => {
							const message = 'Are you sure you wish to commmit this grading session? Ensure you have completed evaluating all questions.  This action cannot be undone.';
							const choice = await this.ask.yesNo(message);
							if (choice) {
								calcRanking();

								$uibModalInstance.close({
									action: 'commit',
									rankedProposals: proposalsToRank
								});
							}
						};

						// Due to a limitation of the angular-dnd-list module, we need to do a swap
						// When a response is drag-and-dropped, a copy is made, which means the proposal loses it's reference to the response object
						// To prevent this, we immediately replace the copy with the original object when it's moved, preserving the reference
						$scope.moved = (question, index): void => {
							const responseList = responsePivot.get(question);
							responseList.splice(swap, 1, responseList[index]);
							responseList.splice(index, 1);
							calcRanking();
						};

						$scope.inserted = (item, index): void => {
							// ensure item just dropped remains selected
							$scope.data.selected = item;
							swap = index;
						};
					}
				]
			},
			{}
		);

		if (modalResponse.action === 'save') {
			try {
				this.proposals = await this.saveProposals(modalResponse.rankedProposals);
				this.opportunity.evaluationStage = this.stages.QUESTIONS_SAVED;
				this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} catch (error) {
				this.handleError(error);
			}
		}
		if (modalResponse.action === 'commit') {
			try {
				this.calculateQuestionScores(modalResponse.rankedProposals);
				this.screenProposals(modalResponse.rankedProposals);
				this.proposals = await this.saveProposals(modalResponse.rankedProposals);
				this.opportunity.evaluationStage = this.stages.CODE_SCORES;
				this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	public async openCodeChallengeModal(): Promise<void> {
		const modalResponse = await this.modalService.showModal(
			{
				size: 'sm',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-code-challenge.html',
				windowClass: 'code-challenge-modal',
				controller: [
					'$scope',
					'$uibModalInstance',
					($scope: IEvalModalScope, $uibModalInstance: ng.ui.bootstrap.IModalInstanceService) => {
						$scope.proposals = angular.copy(this.proposals);
						$scope.maxPoints = this.opportunity.weights.codechallenge * this.maximumScore;

						$scope.cancel = (): void => {
							$uibModalInstance.close({});
						};

						$scope.save = async (): Promise<void> => {
							this.confirmModalSave('Are you sure you wish to commit the code challenge scores as entered?', $uibModalInstance, $scope);
						};
					}
				]
			},
			{}
		);

		if (modalResponse.action === 'save') {
			// for each proposal, ensure score entered results in 80% or higher
			const proposalsToSave: IProposalResource[] = modalResponse.proposalsToSave;
			const maxCodeChallengePoints = this.opportunity.weights.codechallenge * this.maximumScore;
			proposalsToSave.forEach(proposal => {
				if (proposal.screenedIn && proposal.scores.codechallenge / maxCodeChallengePoints >= 0.8) {
					proposal.passedCodeChallenge = true;
					proposal.scores.codechallenge = Math.round((proposal.scores.codechallenge / maxCodeChallengePoints) * (this.opportunity.weights.codechallenge * this.maximumScore) * 100) / 100;
				} else {
					proposal.scores.codechallenge = 0;
					proposal.passedCodeChallenge = false;
				}
			});

			// if at least one proposal passed, then update evaluation stage accordingly
			if (proposalsToSave.find(proposal => proposal.passedCodeChallenge)) {
				this.opportunity.evaluationStage = this.stages.INTERVIEW_SCORES;
			} else {
				this.opportunity.evaluationStage = this.stages.FAIL;
			}

			// sort, and then save the scored proposals and the opportunity
			this.totalAndSort(proposalsToSave);
			this.proposals = await this.saveProposals(proposalsToSave);
			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
		}
	}

	/**
	 * Opens a modal allowing the admin to enter scores for the team scenario/interview stage
	 * Validates based on interview weighting and max points
	 */
	public async openInterviewModal(): Promise<void> {
		const modalResponse = await this.modalService.showModal(
			{
				size: 'sm',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-interview.html',
				windowClass: 'interview-modal',
				controller: [
					'$scope',
					'$uibModalInstance',
					($scope: IEvalModalScope, $uibModalInstance: ng.ui.bootstrap.IModalInstanceService) => {
						$scope.proposals = angular.copy(this.proposals);
						$scope.maxPoints = this.opportunity.weights.interview * this.maximumScore;

						$scope.cancel = (): void => {
							$uibModalInstance.close({});
						};

						$scope.save = async () => {
							this.confirmModalSave('Are you sure you wish to commit the team scenario scores as entered?', $uibModalInstance, $scope);
						};
					}
				]
			},
			{}
		);

		if (modalResponse.action === 'save') {
			const proposalsToSave: IProposalResource[] = modalResponse.proposalsToSave;
			const maxInterviewPoints = this.opportunity.weights.interview * this.maximumScore;
			proposalsToSave.forEach(proposal => {
				proposal.scores.interview = Math.round((proposal.scores.interview / maxInterviewPoints) * (this.opportunity.weights.interview * this.maximumScore) * 100) / 100;
			});

			// calculate price scores
			this.calculatePriceScores(proposalsToSave);
			this.opportunity.evaluationStage = this.stages.PRICE;

			// save proposals and opportunity
			this.totalAndSort(proposalsToSave);
			this.proposals = await this.saveProposals(proposalsToSave);
			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
		}
	}

	public async undoLastStage(): Promise<void> {
		const message = 'WARNING: This will cause any calculations or entered data from the last stage to be deleted.';
		const choice = await this.ask.yesNo(message);
		if (choice) {
			if (this.opportunity.evaluationStage === this.stages.PRICE) {
				this.opportunity.evaluationStage = this.stages.INTERVIEW_SCORES;
			} else if (this.opportunity.evaluationStage === this.stages.ASSIGNED) {
				const assignedProposal = this.proposals.find(proposal => proposal.status === 'Assigned');
				if (assignedProposal) {
					const index = this.proposals.indexOf(assignedProposal);
					const updatedProposal = await this.ProposalService.unassignswu({ proposalId: assignedProposal._id }).$promise;
					this.proposals.splice(index, 1, updatedProposal);
				}
				this.opportunity.proposal = null;
				this.opportunity.evaluationStage = this.stages.PRICE;
			} else if (this.opportunity.evaluationStage === this.stages.FAIL) {
				this.opportunity.evaluationStage = this.stages.CODE_SCORES;
			} else {
				this.opportunity.evaluationStage = this.opportunity.evaluationStage - 1;
			}

			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
			this.$scope.opportunity = this.opportunity;
		}
	}

	public async selectGradingType(type: GradingTypes): Promise<void> {
		const message = `Confirm you wish to use ${type.toLowerCase()} grading`;
		const choice = await this.ask.yesNo(message);
		if (choice) {
			this.opportunity.teamQuestionGradingType = type;
			this.opportunity.evaluationStage = this.stages.QUESTIONS_INIT;
			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
		}
	}

	// Reset the evaluation with confirmation
	public async resetEvaluation(): Promise<void> {
		const message = 'WARNING: This will reset the current evaluation and any calculations or entered data will be lost.  Proceed?';
		const choice = await this.ask.yesNo(message);
		if (choice) {
			// if a proposal was assigned, unassign it
			const assignedProposal = this.proposals.find(proposal => proposal.status === 'Assigned');
			if (assignedProposal) {
				const index = this.proposals.indexOf(assignedProposal);
				const updatedProposal = await this.ProposalService.unassignswu({ proposalId: assignedProposal._id }).$promise;
				this.proposals.splice(index, 1, updatedProposal);
			}

			this.opportunity.evaluationStage = this.stages.NEW;
			this.opportunity.teamQuestionGradingType = this.gradingTypes.LINEAR;
			this.opportunity.proposal = null;
			this.proposals.forEach(async (proposal, index) => {
				proposal.scores.skill = 0;
				proposal.scores.question = 0;
				proposal.scores.codechallenge = 0;
				proposal.scores.interview = 0;
				proposal.scores.total = 0;
				proposal.scores.price = 0;
				proposal.screenedIn = false;
				proposal.teamQuestionResponses.forEach(response => {
					response.rejected = false;
					response.score = 0;
					response.rank = 0;
				});
			});

			this.totalAndSort(this.proposals);
			this.proposals = await this.saveProposals(this.proposals);
			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;

			this.Notification.success({
				message: '<i class="fas fa-check-circle"></i> Evaluation reset'
			});
			this.initializeEvaluation();
		}
	}

	public showCompanyInfo(proposal: IProposalResource): void {
		this.modalService.showModal({
			size: 'md',
			templateUrl: '/modules/proposals/client/views/swu-proposal-view.html',
			windowClass: 'swu-proposal-view-modal',
			controller: 'ProposalViewSWUController',
			controllerAs: 'ppp',
			resolve: {
				proposal
			}
		});
	}

	/**
	 * Assign the opportunity to the given proposal
	 * Updates the proposal that won, and the opportunity
	 * @param {Proposal} proposal
	 */
	public async assignOpportunity(proposal: IProposalResource): Promise<void> {
		const message = `Assign this opportunity to ${proposal.businessName}?`;
		const choice = await this.ask.yesNo(message);
		if (choice) {
			try {

				// Notify user that the opportunity is being assigned
				this.Notification.primary({
					title: 'Please wait',
					message: 'Assigning opportunity...',
					positionX: 'center',
					positionY: 'top',
					closeOnClick: false,
					delay: null
				});

				// Assign the opportunity
				this.opportunity = await this.OpportunitiesService.assignswu({
					opportunityId: this.opportunity.code,
					proposalId: proposal._id
				}).$promise;

				// Update opportunity and proposal
				this.$scope.opportunity = this.opportunity;
				this.proposals = await this.getProposals();

				this.Notification.success({
					message: `<i class="fas fa-check-circle"></i> Opportunity assigned to ${proposal.businessName}`,
					replaceMessage: true
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	// Initialize the evaluation by building the response pivot and then taking further action
	// depending on the evaluation stage
	private async initializeEvaluation(): Promise<void> {
		this.proposals = await this.getProposals();
		if (this.opportunity.evaluationStage === Stages.NEW || this.opportunity.evaluationStage === Stages.REVIEW) {
			this.calculateSkillScores(this.proposals);
			this.opportunity.evaluationStage = Stages.REVIEW;
			this.opportunity = await this.OpportunitiesService.update(this.opportunity).$promise;
		}

		this.totalAndSort(this.proposals);
		this.isLoading = false;
		this.$scope.$apply();
	}

	private async getProposals(): Promise<IProposalResource[]> {
		try {
			return await this.ProposalService.getProposalsForOpp({ opportunityId: this.opportunity._id }).$promise;
		} catch (error) {
			this.handleError(error);
		}
	}

	// Builds a map of team questions from an opportunity to team question responses from a set of proposals
	private buildQuestionPivot(opportunity: IOpportunityResource, proposals: IProposalResource[], includeRejected: boolean): Map<ITeamQuestion, ITeamQuestionResponse[]> {
		const responsePivot = new Map<ITeamQuestion, ITeamQuestionResponse[]>();
		opportunity.teamQuestions.forEach((teamQuestion, index) => {
			responsePivot.set(teamQuestion, []);
			proposals.forEach(proposal => {
				// push response into pivot
				const response = proposal.teamQuestionResponses[index];
				if (!response.rejected || includeRejected) {
					responsePivot.get(teamQuestion).push(response);
				}
			});
		});

		return responsePivot;
	}

	// randomize the ordering of each set of responses
	private randomizeResponseOrder(responsePivot: Map<ITeamQuestion, ITeamQuestionResponse[]>): void {
		for (const keyValuePair of responsePivot) {
			responsePivot.set(keyValuePair[0], _.shuffle(keyValuePair[1]));
		}
	}

	// Returns an array consisting of the aggregated skills from all team members on the given proposals, for all phases
	private getAggregatedProposalSkills(proposal: IProposal): ICapabilitySkill[] {
		const inceptionSkills = _.unionWith(_.flatten(proposal.phases.inception.team.map(member => member.capabilitySkills)), (sk1, sk2) => sk1.code === sk2.code);
		const protoSkills = _.unionWith(_.flatten(proposal.phases.proto.team.map(member => member.capabilitySkills)), (sk1, sk2) => sk1.code === sk2.code);
		const implSkills = _.unionWith(_.flatten(proposal.phases.implementation.team.map(member => member.capabilitySkills)), (sk1, sk2) => sk1.code === sk2.code);

		const aggregatedProposalSkills = _.unionWith(inceptionSkills, protoSkills, implSkills, (sk1, sk2) => sk1.code === sk2.code);

		return aggregatedProposalSkills;
	}

	// calculate skill-based score on proposals in place
	private calculateSkillScores(proposals: IProposalResource[]): void {
		// aggregate skills on opportunity
		const aggregatedOpportunitySkills = _.unionWith(
			this.opportunity.phases.inception.capabilitySkills,
			this.opportunity.phases.proto.capabilitySkills,
			this.opportunity.phases.implementation.capabilitySkills,
			(sk1, sk2) => sk1.code === sk2.code
		);

		// length is the max possible score
		const maxPossibleSkillScore = aggregatedOpportunitySkills.length;

		// for each proposal, determine the number of overlapping skills between the proposal and the opportunity
		// the number of overlapping skills is the raw score
		proposals.forEach(proposal => {
			proposal.scores.skill = 0;
			if (maxPossibleSkillScore > 0) {
				const aggregatedProposalSkills = this.getAggregatedProposalSkills(proposal);

				// raw score is intersection, used to calculate weighted score percentage
				const rawScore = _.intersectionWith(aggregatedOpportunitySkills, aggregatedProposalSkills, (sk1, sk2) => sk1.code === sk2.code).length;
				proposal.scores.skill = Math.round((rawScore / maxPossibleSkillScore) * (this.opportunity.weights.skill * this.maximumScore) * 100) / 100;
			}
		});
	}

	// Function for calculating scoring based on team question ranking (linear or weighted)
	private calculateQuestionScores(proposals: IProposalResource[]): void {
		// determine total number of team question points attainable for this opportunity
		const totalQuestionPoints = this.opportunity.teamQuestions.reduce((accum, question) => accum + question.questionScore, 0);
		const teamQuestionWeights = this.opportunity.teamQuestions.map(question => question.questionScore / totalQuestionPoints);

		// if linear scoring
		if (this.opportunity.teamQuestionGradingType === this.gradingTypes.LINEAR) {
			const bestPossibleScore = proposals.length;
			// determine score based on rank
			proposals.forEach(proposal => {
				const questionScores = proposal.teamQuestionResponses.map((response, index) => {
					return response.rejected ? 0 : (bestPossibleScore - response.rank + 1) * teamQuestionWeights[index];
				});

				// accumulate points across question responses
				const totalPoints = questionScores.reduce((accum, score) => accum + score, 0);

				// weight and assign to proposal
				proposal.scores.question = Math.round((totalPoints / bestPossibleScore) * (this.opportunity.weights.question * this.maximumScore) * 100) / 100;
			});
		} else {
			const bestPossibleScore = this.maxScoreForWeightedQuestionGrading;
			// determine score based on input score for response
			proposals.forEach(proposal => {
				const questionScores = proposal.teamQuestionResponses.map((response, index) => {
					return response.rejected ? 0 : response.score * teamQuestionWeights[index];
				});

				const totalPoints = questionScores.reduce((accum, score) => accum + score, 0);

				// weight and assign to proposal
				proposal.scores.question = Math.round((totalPoints / bestPossibleScore) * (this.opportunity.weights.question * this.maximumScore) * 100) / 100;
			});
		}
	}

	// Calculates scores for pricing bids.
	// Scores are relative to the lowest bidding proposal (who receives full points)
	// Weightings for price scores are factored in at this stage as well.
	private calculatePriceScores(proposals: IProposalResource[]): void {
		// determine lowest bidding proposal that did not bid $0
		proposals.forEach(proposal => {
			proposal.totalCost = proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost;
		});
		const validProposals = proposals.filter(proposal => proposal.totalCost > 0 && proposal.screenedIn && proposal.passedCodeChallenge);
		const lowestBiddingProposal = _.minBy(validProposals, 'totalCost');

		validProposals.forEach(proposal => {
			proposal.scores.price = Math.round((lowestBiddingProposal.totalCost / proposal.totalCost) * (this.opportunity.weights.price * this.maximumScore) * 100) / 100;
		});
	}

	// sort the proposals based on the current aggregate score
	private totalAndSort(proposals: IProposalResource[]): void {
		proposals.forEach(proposal => {
			proposal.scores.total = Math.round((proposal.scores.skill + proposal.scores.question + proposal.scores.codechallenge + proposal.scores.interview + proposal.scores.price) * 100) / 100;
		});

		proposals.sort((proposalA, proposalB) => proposalB.scores.total - proposalA.scores.total);
	}

	// Calculates rankings so that top 4 companies can be screened in
	// Teams that tie in points are considered to be in the same position
	// The highest scoring team following a tie will be considered to be in the position relative to the other teams
	// (If two teams tie for 1st, the next team will be in 3rd)
	private screenProposals(proposals: IProposalResource[]): void {
		// ensure totaled and sorted by score
		this.totalAndSort(proposals);

		// assign rank based on position in list
		proposals.forEach((proposal, index) => {
			proposal.ranking = index + 1;

			// if a score is the same as the previous score, assign it the same ranking, otherwise leave it as is
			if (index > 0) {
				const prevScore = proposals[index - 1].scores.total;
				if (proposal.scores.total === prevScore) {
					proposal.ranking = proposals[index - 1].ranking;
				}
			}

			proposal.ranking > this.numberOfTeamsToScreen ? (proposal.screenedIn = false) : (proposal.screenedIn = true);
		});
	}

	private async saveProposals(proposals: IProposalResource[]): Promise<IProposalResource[]> {
		if (!this.canEdit) {
			return;
		}

		try {
			const updatedProposals = await Promise.all(proposals.map(proposal => this.ProposalService.update(proposal).$promise));
			return updatedProposals;
		} catch (error) {
			this.handleError(error);
			return proposals;
		}
	}

	private async confirmModalSave(message: string, modalInstance: ui.bootstrap.IModalServiceInstance, scope: IEvalModalScope): Promise<void> {
		const choice = await this.ask.yesNo(message);
		if (choice) {
			modalInstance.close({
				action: 'save',
				proposalsToSave: scope.proposals
			});
		}
	}

	private handleError(error: any): void {
		const errorMessage = error.data ? error.data.message : error.message;
		this.Notification.error({
			title: 'Error',
			message: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`
		});
	}
}

angular.module('opportunities').directive('opportunityEvaluation', () => {
	return {
		scope: {
			opportunity: '='
		},
		controllerAs: 'vm',
		templateUrl: '/modules/opportunities/client/views/swu-opportunity-eval-directive.html',
		controller: OpportunityEvaluationDirectiveController
	};
});
