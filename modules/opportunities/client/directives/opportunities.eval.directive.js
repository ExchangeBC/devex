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
			controller: ['$scope', '$state', 'Authentication', 'Notification', 'ProposalsService', 'ask', 'modalService',
			function($scope, $state, Authentication, Notification, ProposalsService, ask, modalService) {

				var vm = this;
				vm.opportunity 			= $scope.opportunity;
				vm.authentication 		= Authentication;
				vm.isUser				= Authentication.user;
				vm.isAdmin				= vm.isUser && ~Authentication.user.roles.indexOf('admin');
				vm.canEdit				= vm.isAdmin || $scope.opportunity.userIs.admin;
				vm.maxPoints			= 100;
				vm.isLoading			= true;
				vm.bestScoreWeighted 	= 5;


				/**
				 * Constants for evaluation stages for SWU proposals
				 */
				vm.stages = {
					new					: 0,
					pending_review		: 1,
					choose_grade_type	: 2,
					questions			: 3,
					questions_saved		: 4,
					code_scores			: 5,
					interview			: 6,
					price				: 7,
					assigned			: 8,
					all_fail			: 9
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

				vm.maxCodeChallengePoints = vm.weights.codechallenge * vm.maxPoints;
				vm.maxInterviewPoints = vm.weights.interview * vm.maxPoints;
				vm.topProposal = null;

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
									responses[index].push(proposal.teamQuestionResponses[index]);
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
								proposal.scores.skill = Math.round((proposal.scores.skill / maxScore) * (vm.weights.skill * vm.maxPoints) * 100) / 100;
							}
						});
						resolve(proposals);
					});
				}

				/**
				 * Total up the proposal scores
				 * and sort highest to lowest
				 */
				var totalAndSort = function(proposals) {
					return new Promise(function(resolve, reject) {
						proposals.forEach(function(proposal) {
							proposal.scores.total = Math.round((proposal.scores.skill + proposal.scores.question + proposal.scores.codechallenge + proposal.scores.interview + proposal.scores.price) * 100) / 100;
						});

						vm.proposals.sort(function(a, b) {
							return b.scores.total - a.scores.total;
						});
						if (vm.proposals && vm.proposals.length > 0) {
							vm.topProposal = vm.proposals[0];
						}

						resolve(proposals);
					});
				}

				/**
				 * Save an individual proposal
				 * @param {*} proposal Proposal to save
				 */
				var saveProposal = function(proposal) {
					if (!vm.canEdit) {
						return;
					}

					return proposal.$update();
				};

				/**
				 * Save the entire set of proposals
				 */
				var saveProposals = function() {
					if (!vm.canEdit) {
						return;
					}

					return Promise.all (vm.proposals.map (function(proposal) {
						return saveProposal(proposal);
					}));
				};

				/**
				 * Save the current opportunity
				 */
				var saveOpportunity = function() {
					if (!vm.canEdit) {
						return;
					}

					return vm.opportunity.$update();
				};

				/**
				 * Initialize the evaluation by building the question pivot and then taking further action
				 * depending on the evaluation stage
				 */
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
									return vm.proposals;
								})
								.then(totalAndSort);
							break;

							case vm.stages.choose_grade_type:
							case vm.stages.questions:
							case vm.stages.questions_saved:
							case vm.stages.code_scores:
							case vm.stages.interview:
							case vm.stages.price:
							case vm.stages.assigned:
							case vm.stages.all_fail:
								vm.responses = values.responses;
								vm.proposals = values.proposals;
								Promise.resolve(vm.proposals)
								.then(totalAndSort);
							break;
						};
						vm.isLoading = false;
					});
				}

				/**
				 * Helper function for adjusting question rankings after questions have been rejected
				 */
				var recalculateRankings = function() {
					return new Promise(function(resolve, reject) {
						vm.responses.forEach(function(responseArray) {
							responseArray.filter(function(response) {
								return response.rejected;
							})
							.forEach(function(rejResponse) {
								responseArray.forEach(function(response) {
									if (rejResponse === response) {
										response.rank = 0;
									}
									else if (rejResponse.rank < response.rank) {
										response.rank -= 1;
									}
								})
							});
						});
						resolve();
					});
				}

				/**
				 * Function for calculating scoring based on team question ranking
				 * since the ranking is from 1 - n we want to invert it and then add up and
				 * give a percent over best possible score
				 * n = number of proposals
				 * m = number of questions
				 * Q(r) = question ranking (will be from 1 to n with 1 being the best)
				 * score = sum ( (n+1)-Q(r) ) / (n * m) * 400
				 * Rejected questions are not considered in the scoring
				 */
				var scoreTeamQuestions = function(proposals) {

					var totalQuestionPoints = vm.opportunity.teamQuestions
					.map(function(question) {
						return question.questionScore;
					})
					.reduce(function(a, b) {
						return a + b;
					}, 0);

					var teamQuestionWeights = vm.opportunity.teamQuestions.map(function(question) {
						return question.questionScore / totalQuestionPoints;
					});

					if (vm.opportunity.teamQuestionGradingType === 'Linear') {

						var bestScore = proposals.length;

						proposals.forEach(function(proposal) {

							proposal.scores.question = Math.round(
								proposal.teamQuestionResponses
								.map(function(response, index) {
									if (response.rejected) {
										return 0;
									}
									return (vm.proposals.length + 1 - response.rank) * teamQuestionWeights[index];
								})
								.reduce(function(a, b) {
									return a + b;
								}, 0) / bestScore * (vm.weights.question * vm.maxPoints) * 100) / 100;
						});
					}
					else {
						proposals.forEach(function(proposal) {

							var bestScore = vm.bestScoreWeighted;

							proposal.scores.question = Math.round(
								proposal.teamQuestionResponses
								.map(function(response, index) {
									if (response.rejected) {
										return 0;
									}
									return (response.score * teamQuestionWeights[index]);
								})
								.reduce(function(a, b) {
									return a + b;
								}, 0) / bestScore * (vm.weights.question * vm.maxPoints) * 100) / 100;

						});
					}

					return proposals;
				};

				/**
				 * Calculates rankings so that top 4 companies can be screened in - assumes the proposal are already sorted by current score
				 * Teams that tie in points are considered to be in the same position
				 * The highest scoring team following a tie will be considered to be in the position relative to the other teams
				 * (If two teams tie for 1st, the next team will be in 3rd)
				 */
				var screenProposals = function(proposals) {
					// assign rank based on ordering
					proposals.forEach(function(proposal, index) {
						proposal.ranking = index + 1;

						// if a score is the same as the previous score, assign it the same ranking, otherwise leave it as is
						if (index > 0) {
							var prevScore = proposals[index - 1].scores.total;
							if (proposal.scores.total === prevScore) {
								proposal.ranking = proposals[index - 1].ranking;
							}
						}

						proposal.ranking > 4 ? proposal.screenedIn = false : proposal.screenedIn = true;
					});

					return proposals;
				}

				/**
				 * Calculates scores for pricing bids.
				 * Scores are relative to the lowest bidding proposal (who receives full points)
				 * Weightings for price scores are factored in at this stage as well.
				 */
				var calculatePriceScores = function (proposals) {
					var lowestBidder;
					var passedProposals = proposals.filter(function(proposal) {
						return proposal.screenedIn && proposal.passedCodeChallenge;
					})

					passedProposals.forEach(function(proposal) {
						proposal.cost = proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost;
						if (lowestBidder !== 0 && (lowestBidder === undefined || proposal.cost < lowestBidder.cost)) {
							lowestBidder = proposal;
						}
					})

					passedProposals.forEach(function(proposal) {
						if (proposal.cost === 0) {
							proposal.scores.price = 0;
						}
						else {
							proposal.scores.price = Math.round((lowestBidder.cost/proposal.cost) * (vm.weights.price * vm.maxPoints) * 100) / 100;
						}
					})

					return proposals;
				};

				/**
				 * Open up a modal for question review.
				 * An admin will use this modal to reject self-identifying responses.
				 */
				vm.openQuestionReviewModal = function() {
					modalService.showModal({
						size: 'md',
						templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-question-vetting.html',
						controller: function($scope, $uibModalInstance) {
							$scope.data				   = {};
							$scope.data.questions      = [];
							$scope.data.proposals      = vm.proposals;
							$scope.data.nproposals     = vm.proposals.length;
							$scope.data.questions      = vm.opportunity.teamQuestions;
							$scope.data.responses      = vm.responses;
							$scope.data.totalQuestions = vm.opportunity.teamQuestions.length;
							$scope.data.currentPage    = 1;

							$scope.cancel = function() {
								$uibModalInstance.close({});
							};
							$scope.save = function() {
								$uibModalInstance.close({
									action: 'save',
									responses: $scope.data.responses
								});
							};
							$scope.commit = function() {
								// Prompt user for confirmation before committing review
								var message = 'Are you sure you wish to commmit your validation? Ensure you have reviewed all questions.  This action cannot be undone.';
								ask.yesNo(message).then (function(response) {
									if (response) {
										$uibModalInstance.close({
											action: 'commit'
										});
									}
								});
							};
						}
					})
					.then(function(resp) {

						if (resp.action === 'save') {
							// recalculate rankings and save proposals, but do not end vetting stage
							Promise.resolve()
							.then(recalculateRankings)
							.then(saveProposals);
						}
						else if (resp.action === 'commit') {
							// recalculate rankings, move to next evaluation stage, save proposals and opp
							Promise.resolve()
							.then(recalculateRankings)
							.then(function() {
								vm.opportunity.evaluationStage = vm.stages.choose_grade_type;
							})
							.then(saveProposals)
							.then(saveOpportunity);
						}
					});
				}

				/**
				 * Open up a modal for question ranking
				 * The modal allows questions to be comparatively ranked
				 */
				vm.openQuestionRankingModal = function() {

					var modalMarkupUrl;
					if (vm.opportunity.teamQuestionGradingType === 'Linear') {
						modalMarkupUrl = '/modules/opportunities/client/views/swu-opportunity-modal-eval-questions-linear.html';
					}
					else {
						modalMarkupUrl = '/modules/opportunities/client/views/swu-opportunity-modal-eval-questions-weighted.html';
					}

					modalService.showModal ({
						size: 'lg',
						templateUrl: modalMarkupUrl,
						controller: function ($scope, $uibModalInstance) {

							$scope.data                = {};
							$scope.data.proposals      = vm.proposals;
							$scope.data.nproposals     = vm.proposals.length;
							$scope.data.questions      = vm.opportunity.teamQuestions;
							$scope.data.totalQuestions = vm.opportunity.teamQuestions.length;
							$scope.data.currentPage    = 1;

							$scope.data.model = {
								selected: null,
								questions: vm.responses.map(function(respArray) {
									return respArray.filter(function(resp) {
										return !resp.rejected;
									});
								})
							};

							$scope.data.model.questions.forEach(function(respArray) {

								// set initial order by current ranking
								respArray.sort(function(a, b) {
									return a.rank - b.rank;
								});
							});

							$scope.pageChanged = function() {
								$scope.data.model.selected = null;
							}

							$scope.close = function() {
								$uibModalInstance.close({});
							};

							$scope.save = function() {
								$uibModalInstance.close({
									action: 'save',
									questions: $scope.data.model.questions
								});
							};

							$scope.validateScores = function() {
								$scope.data.scoresValid = true;
								$scope.data.model.questions.forEach(function(question) {
									question.forEach(function(response) {
										if (response.score === undefined || response.score < 1 || response.score > 5) {
											$scope.data.scoresValid = false;
										}
									});
								});
							}

							$scope.commit = function() {
								var message = 'Are you sure you wish to commmit this grading session? Ensure you have completed evaluating all questions.  This action cannot be undone.';
								ask.yesNo(message).then (function(resp) {
									if (resp) {
										$uibModalInstance.close({
											action: 'commit',
											questions: $scope.data.model.questions
										});
									}
								});
							};

							$scope.inserted = function(item) {
								// ensure item just dropped remains selected
								$scope.data.model.selected = item;
							};

							$scope.validateScores();
						}
					}, {
					})
					.then (function(resp) {

						if (resp.questions) {
							vm.proposals.forEach(function(proposal) {
								proposal.teamQuestionResponses.forEach(function(response, index) {

									var match = resp.questions[index].find(function(question) {
										return response._id === question._id;
									});

									if (match) {
										response.rank = resp.questions[index].indexOf(match) + 1;
										response.score = match.score;
									}
								});
							});
						}

						if (resp.action === 'save') {
							Promise.resolve()
							.then(saveProposals)
							.then(function() {
								vm.opportunity.evaluationStage = vm.stages.questions_saved;
							})
							.then(saveOpportunity);
						}
						if (resp.action === 'commit') {
							Promise.resolve(vm.proposals)
							.then(scoreTeamQuestions)
							.then(totalAndSort)
							.then(screenProposals)
							.then(saveProposals)
							.then(function() {
								vm.opportunity.evaluationStage = vm.stages.code_scores;
							})
							.then(saveOpportunity);
						}
					});
				};

				/**
				 * Opens a modal for inputting code challenge scores for each team
				 * Validates scores based on weight for CC
				 */
				vm.openCodeChallengeModal = function () {
					modalService.showModal ({
						size: 'sm',
						templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-code-challenge.html',
						controller: function ($scope, $uibModalInstance) {
							$scope.data = {};
							$scope.data.proposalScores = [];
							$scope.data.maxCodeChallengePoints = vm.maxCodeChallengePoints;
							vm.proposals.forEach(function(proposal) {
								if (proposal.screenedIn) {
									$scope.data.proposalScores.push({ businessName: proposal.businessName, score: undefined })
								}
							})
							$scope.cancel = function () {
								$uibModalInstance.close ({});
							};
							$scope.save = function () {
								$uibModalInstance.close ({
									action : 'save',
									proposalScores  : $scope.data.proposalScores
								});
							};
						}
					}, {
					})
					.then (function (resp) {
						if (resp.action === 'save') {
							var scoreCount = 0;
							var passCount = 0;
							resp.proposalScores.forEach(function(score) {
								var match = vm.proposals.find(function(proposal) {
									return proposal.businessName === score.businessName;
								});

								if (match) {
									if (score.score / vm.maxCodeChallengePoints >= 0.8) {
										match.passedCodeChallenge = true;
										match.scores.codechallenge = Math.round((score.score / vm.maxCodeChallengePoints) * (vm.weights.codechallenge * vm.maxPoints) * 100) / 100;
										passCount++;
									}
									else {
										match.passedCodeChallenge = false;
									}

									scoreCount++;
								}
							});

							// if we have scored all proposal for the code challenge stage, and at least 1 company passed, move on
							if (scoreCount === vm.proposals.filter(function(proposal) { return proposal.screenedIn}).length) {
								if (passCount > 0) {
									vm.opportunity.evaluationStage = vm.stages.interview
								}
								else {
									vm.opportunity.evaluationStage = vm.stages.all_fail;
								}
							}

							// calculate rankings
							Promise.resolve(vm.proposals)
							.then(totalAndSort)
							.then(saveProposals)
							.then(saveOpportunity);
						}
					});
				};

				/**
				 * Opens a modal allowing the admin to enter scores for the team scenario/interview stage
				 * Validates based on interview weighting and max points
				 */
				vm.openInterviewModal = function () {
					modalService.showModal ({
						size: 'sm',
						templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-interview.html',
						controller: function ($scope, $uibModalInstance) {
							$scope.data = {};
							$scope.data.maxInterviewPoints = vm.maxInterviewPoints;
							$scope.data.proposalScores = [];
							vm.proposals.forEach(function(proposal) {
								if (proposal.screenedIn && proposal.passedCodeChallenge) {
									$scope.data.proposalScores.push({ businessName: proposal.businessName, score: null })
								}
							})
							$scope.cancel = function () {
								$uibModalInstance.close ({});
							};
							$scope.save = function () {
								$uibModalInstance.close ({
									action : 'save',
									proposalScores  : $scope.data.proposalScores
								});
							};
						}
					}, {
					})
					.then (function (resp) {
						if (resp.action === 'save') {

							var scoreCount = 0;
							resp.proposalScores.forEach(function(score) {
								var match = vm.proposals.find(function(proposal) {
									return proposal.businessName === score.businessName;
								});
								if (match) {
									match.scores.interview = Math.round((score.score / vm.maxInterviewPoints)  * (vm.weights.interview * vm.maxPoints) * 100) / 100;
									scoreCount++;
								}
							});

							// if we have scored all proposal for the interview stage, calculate price scores
							var promise;
							if (scoreCount === vm.proposals.filter(function(proposal) {
									return proposal.screenedIn && proposal.passedCodeChallenge;
								}).length) {
									promise = Promise.resolve(vm.proposals)
									.then(calculatePriceScores)
									.then(function(proposals) {
										vm.opportunity.evaluationStage = vm.stages.price;
										return proposals;
									})
							}
							else {
								promise = Promise.resolve(vm.proposals);
							}

							promise
							.then(totalAndSort)
							.then(saveProposals)
							.then(saveOpportunity);
						}
					});
				};

				/**
				 * Assign the opportunity to the given proposal
				 * Updates the proposal that won, and the opportunity
				 * @param {Proposal} proposal
				 */
				vm.assignOpportunity = function (proposal) {
					var message = 'Are you sure you want to assign this opportunity to this proponent?';
					ask.yesNo(message).then(function (resp) {
						if (resp) {
							ProposalsService.assignswu(proposal).$promise
							.then (
								function (response) {
									vm.proposals[vm.proposals.indexOf(proposal)] = response;
									proposal = response;
									Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i> Company has been assigned'});
									$state.go ('opportunities.viewswu',{opportunityId:vm.opportunity.code});
									vm.opportunity.evaluationStage = vm.stages.assigned;
									vm.opportunity.proposal = proposal;
									proposal.isAssigned = true;
									Promise.resolve(proposal)
									.then(saveProposal)
									.then(saveOpportunity);
								},
								function (error) {
									 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Proposal Assignment failed!' });
								}
							);
						}
					});
				};

				/**
				 * Open a modal to display specific info about the selected proposal/business
				 * @param {Proposal} proposal
				 */
				vm.showCompanyInfo = function(proposal) {
					modalService.showModal({
						size: 'md',
						templateUrl: '/modules/proposals/client/views/swu-proposal-view.html',
						controller: function($scope, $uibModalInstance) {
							$scope.data = {};
							$scope.data.proposal = proposal;
							$scope.close = function() {
								$uibModalInstance.close({});
							}
						}
					})
				}

				/**
				 * Reset the evaluation back to the first stage.  Prompt the user for confirmation first.
				 */
				vm.resetEvaluation = function () {

					var message = 'WARNING: This will reset the current evaluation and any calculations or entered data will be lost.  Proceed?';
					ask.yesNo(message).then(function(response) {
						if (response) {
							vm.opportunity.evaluationStage = vm.stages.new;
							vm.opportunity.teamQuestionGradingType = 'Linear';
							vm.opportunity.proposal = null;
							vm.proposals.forEach(function(proposal) {
								proposal.scores.skill = 0;
								proposal.scores.question = 0;
								proposal.scores.codechallenge = 0;
								proposal.scores.interview = 0;
								proposal.scores.total = 0;
								proposal.scores.price = 0;
								proposal.isAssigned = false;
								proposal.screenedIn = false;
								proposal.teamQuestionResponses.forEach(function(response) {
									response.rejected = false;
									response.score = 0;
								});
								proposal.status = 'Submitted';
							});

							Promise.resolve(vm.proposals)
							.then(totalAndSort)
							.then(saveProposals)
							.then(saveOpportunity)
							.then(initializeEvaluation);
						}
					});
				}

				vm.selectLinearGrading = function() {
					var message = 'Confirm you wish to use linear grading';
					ask.yesNo(message)
					.then(function(response) {
						if (response) {
							vm.opportunity.teamQuestionGradingType = 'Linear';
							vm.opportunity.evaluationStage = vm.stages.questions;
							Promise.resolve()
							.then(saveOpportunity);
						}
					});
				}

				vm.selectWeightedGrading = function() {
					var message = 'Confirm you wish to use weighted grading';
					ask.yesNo(message)
					.then(function(response) {
						if (response) {
							vm.opportunity.teamQuestionGradingType = 'Weighted';
							vm.opportunity.evaluationStage = vm.stages.questions;
							Promise.resolve()
							.then(saveOpportunity);
						}
					});
				}

				// Initialze the evaluation
				Promise.resolve()
				.then(initializeEvaluation);
			}]
		}
	});
}());
