(function () {
	'use strict';
	angular.module('opportunities')

	/**
	 * Directive for showing evaluation stages for SWU opportunities
	 */
	.directive('opportunityEvaluation', function() {
		return {
			scope: {
				opportunity: '='
			},
			controllerAs: 'vm',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-eval-directive.html',
			controller: ['$scope', 'Authentication', 'ProposalsService', 'ask',
			function($scope, Authentication, ProposalsService, ask) {

				var vm = this;
				vm.opportunity 		= $scope.opportunity;
				vm.authentication 	= Authentication;
				vm.isUser			= Authentication.user;
				vm.isAdmin			= vm.isUser && ~Authentication.user.roles.indexOf('admin');
				vm.canEdit			= vm.isAdmin || $scope.opportunity.userIs.admin;
				vm.maxPoints		= 100;


				/**
				 * Constants for evaluation stages for SWU proposals
				 */
				vm.stages = {
					new				: 0,
					pending_review	: 1,
					questions		: 2,
					questions_saved	: 3,
					code_scores		: 4,
					interview		: 5,
					price			: 6,
					assigned		: 7,
					all_fail		: 8
				};

				/**
				 * Weighting for opportunity evaluations
				 * TODO: Have these pulled from the opportunity itself rather than hardcoded in
				 */
				vm.weights = {
					price			: 0.1,
					interview		: 0.25,
					question		: 0.25,
					skill			: 0.05,
					codechallenge	: 0.35
				};

				/**
				 * Utility function for determining open/closed status
				 * Returns a string of time remaining or 'CLOSED' if the deadline has passed
				 */
				var getTimeLeft = function(opportunity) {
					var difference = opportunity.deadline - new Date();
					if (difference > 0) {
						var diffDays = Math.floor(difference / 86400000);
						var diffHours = Math.floor((difference % 86400000) / 3600000);
						var diffMinutes = Math.floor(((difference & 86400000) % 3600000) / 6000);

						if (diffDays > 0) {
							return diffDays + ' days ' + diffHours + ' hours ' + diffMinutes + ' minutes';
						}
						else if (diffHours > 0) {
							return diffHours + ' hours ' + diffMinutes + ' minutes';
						}
						else if (diffMinutes > 0) {
							return diffMinutes + ' minutes';
						}
					}
					else {
						return 'CLOSED';
					}
				}
				vm.closing = getTimeLeft(vm.opportunity);

				/**
				 * Builds a question pivot consisting of a two dimensional array
				 * of responses to team questions for all proposals
				 * vm.responses = [array of questions][array of responses]
				 */
				var buildQuestionPivot = function() {
					return new Promise(function(resolve, reject) {
						// Fetch the proposals for this opportunity and build the pivot out of the responses
						ProposalsService.forOpportunity({ opportunityId: vm.opportunity._id }).$promise
						.then(function(proposals) {
							var responses = [];
							vm.opportunity.teamQuestions.forEach(function(teamQuestion, index) {
								responses[index] = [];
								proposals.forEach(function(proposal) {
									if (!proposal.teamQuestionResponses[index].rejected) {
										responses[index].push(proposal.teamQuestionResponses[index]);
									}
								});
							});
							resolve({ responses: responses, proposals: proposals });
						});
					});
				}

				/**
				 * Randomizes the given pivot of responses
				 * @param {Object[][]} responses 2D pivot matrix of responses (question x response per team)
				 */
				var randomizeResponseOrder = function(responses) {
					return new Promise(function(resolve, reject) {
						responses.forEach(function(responseSet) {

							// Randomize rankings within each set
							responseSet.forEach(function(response) {
								response.rank = Math.floor((Math.random() * 1000) + 1);
							});

							// Sort the set by ranking
							responseSet.sort(function(responseA, responseB) {
								if (responseA.rank < responseB.rank) {
									return -1;
								}
								else if (responseA.rank > responseB.rank) {
									return 1;
								}
								return 0;
							});
						});
						resolve(responses);
					});
				}

				/**
				 * Calculates scores for preferred skills on a collection of proposals
				 * @param {Proposal[]} proposals Array of proposals to calculate skill scores on
				 */
				var calculateSkillScores = function(proposals) {
					return new Promise(function(resolve, reject) {
						var maxScore = vm.opportunity.phases.aggregate.capabilitySkills.length;

						// For each proposal, total up number of applicable skills
						proposals.forEach(function(proposal) {
							proposal.scores.skill = 0;
							if (maxScore > 0) {
								vm.opportunity.phases.aggregate.capabilitySkills.forEach(function(skill) {
									if (proposal.phases.aggregate.capabilitySkills.indexOf(skill._id) >= 0) {
										proposal.scores.skill++;
									}
								});
								proposal.scores.skill = Math.round((proposal.scores.skill / maxScore) + (vm.weights.skill * vm.maxPoints) * 100) / 100;
							}
						});
						resolve(proposals);
					});
				}

				/**
				 * Total up the proposal scores
				 * and sort highest to lowest
				 */
				var totalAndSort = function() {
					return new function() {
						return new Promise(function(resolve, reject) {
							vm.proposals.forEach(function(proposal) {
								proposal.scores.total = Math.round((proposal.scores.skill + proposal.scores.question + proposal.scores.codechallenge + proposal.scores.interview + proposal.scores.price) * 100) / 100;
							});

							vm.proposals.sort(function(a, b) {
								return b.scores.total - a.scores.total;
							});
							resolve();
						})
					}
				}

				var saveProposal = function(proposal) {
					if (!vm.canEdit) {
						return;
					}

					return proposal.$update();
				};

				var saveProposals = function() {
					return function() {
						if (!vm.canEdit) {
							return;
						}

						return Promise.all (vm.proposals.map (function(proposal) {
							return saveProposal(proposal);
						}));
					}
				};

				var saveOpportunity = function() {
					return function() {
						if (!vm.canEdit) {
							return;
						}

						return vm.opportunity.$update();
					}
				};

				var initializeEvaluation = function() {
					buildQuestionPivot()
					.then(function(values) {
						switch (vm.opportunity.evaluationStage) {
							case vm.stages.new:
							case vm.stages.pending_review:
								Promise.all([randomizeResponseOrder(values.responses), calculateSkillScores(values.proposals)])
								.then(function(results) {
									vm.responses = results[0];
									vm.proposals = results[1];
									vm.opportunity.evaluationStage = vm.stages.pending_review;
								});
						};
					});
				}

				/**
				 * Retrieve the top proposal
				 * If the proposals have been totaled and sorted this returns
				 * the proposal with the highest total score.
				 */
				vm.getTopProposal = function() {
					if (vm.proposals && vm.proposals.length > 0) {
						return vm.proposals[0];
					}
					return null;
				}

				vm.resetEvaluation = function () {

					var message = 'WARNING: This will reset the current evaluation and any calculations or entered data will be lost.  Proceed?';
					ask.yesNo(message).then(function(response) {
						if (response) {
							vm.opportunity.evaluationStage = vm.stages.new;
							vm.proposal = null;
							vm.proposals.forEach(function(proposal) {
								proposal.scores.skill = 0;
								proposal.scores.question = 0;
								proposal.scores.codechallenge = 0;
								proposal.scores.interview = 0;
								proposal.scores.total = 0;
								proposal.scores.price = 0;
								proposal.isAssigned = false;
								proposal.screenedIn = false;
								proposal.teamQuestionResponses.forEach(function(question) {
									question['rejected'] = false;
								});
							})

							Promise.resolve()
							.then(totalAndSort)
							.then(saveProposals)
							.then(saveOpportunity)
							.then(initializeEvaluation);
						}
					});
				}

				/**
				 * Utility functions for determining stage of evaluation
				 */
				vm.beforeStage = function(stage) {
					return vm.opportunity.evaluationStage < vm.stages[stage];
				}
				vm.pastStage = function(stage) {
					return vm.opportunity.evaluationStage > vm.stages[stage];
				}
				vm.stageIs = function(stage) {
					return vm.opportunity.evaluationStage === vm.stages[stage];
				}

				initializeEvaluation();
			}]
		}
	});
}());
