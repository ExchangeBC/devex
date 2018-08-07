// =========================================================================
//
// `this set of controllers is for SWU opportunities specifically
//
// =========================================================================
(function () {
	'use strict';
	var formatDate = function (d) {
		var monthNames = [
		'January', 'February', 'March',
		'April', 'May', 'June', 'July',
		'August', 'September', 'October',
		'November', 'December'
		];
		var day = d.getDate();
		var monthIndex = d.getMonth();
		var year = d.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', '+ year;
	}

	angular.module('opportunities')
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewSWUController', function (capabilities, $state, $stateParams, $sce, org, opportunity, Authentication, OpportunitiesService, ProposalsService, Notification, modalService, ask, myproposal, CapabilitiesMethods, OpportunitiesCommon) {
		if (!opportunity) {
			console.error ('no opportunity provided');
			$state.go('opportunities.list');
		}
		var vm                    = this;
		vm.myproposal             = myproposal;
		vm.projectId              = $stateParams.projectId;
		vm.opportunity            = opportunity;
		vm.pageViews              = opportunity.views;
		vm.opportunity.deadline   = new Date (vm.opportunity.deadline);
		vm.opportunity.assignment = new Date (vm.opportunity.assignment);
		vm.opportunity.start      = new Date (vm.opportunity.start);
		vm.opportunity.endDate    = new Date (vm.opportunity.endDate);
		vm.org					  = org;

		vm.opportunity.phases.inception.startDate      = new Date (vm.opportunity.phases.inception.startDate);
		vm.opportunity.phases.inception.endDate        = new Date (vm.opportunity.phases.inception.endDate);
		vm.opportunity.phases.proto.startDate          = new Date (vm.opportunity.phases.proto.startDate);
		vm.opportunity.phases.proto.endDate            = new Date (vm.opportunity.phases.proto.endDate);
		vm.opportunity.phases.implementation.startDate = new Date (vm.opportunity.phases.implementation.startDate);
		vm.opportunity.phases.implementation.endDate   = new Date (vm.opportunity.phases.implementation.endDate);

		vm.opportunity.phases.inception.fstartDate      = formatDate (vm.opportunity.phases.inception.startDate      ) ;
		vm.opportunity.phases.inception.fendDate        = formatDate (vm.opportunity.phases.inception.endDate        ) ;
		vm.opportunity.phases.proto.fstartDate          = formatDate (vm.opportunity.phases.proto.startDate          ) ;
		vm.opportunity.phases.proto.fendDate            = formatDate (vm.opportunity.phases.proto.endDate            ) ;
		vm.opportunity.phases.implementation.fstartDate = formatDate (vm.opportunity.phases.implementation.startDate ) ;
		vm.opportunity.phases.implementation.fendDate   = formatDate (vm.opportunity.phases.implementation.endDate   ) ;

		vm.authentication         = Authentication;
		vm.OpportunitiesService   = OpportunitiesService;
		vm.idString               = 'opportunityId';
		vm.display                = {};
		vm.display.description    = $sce.trustAsHtml(vm.opportunity.description);
		vm.display.evaluation     = $sce.trustAsHtml(vm.opportunity.evaluation);
		vm.display.criteria       = $sce.trustAsHtml(vm.opportunity.criteria);
		vm.display.addenda		  = vm.opportunity.addenda;
		vm.display.addenda.forEach(function(addendum) {
			addendum.cleanDesc = $sce.trustAsHtml(addendum.description);
		});
		vm.trust = $sce.trustAsHtml;
		vm.canApply = org && org.metRFQ;
		vm.opportunity.hasOrg = vm.canApply;
		vm.numberOfInterviews = vm.opportunity.numberOfInterviews;
		//
		// set up the structures for capabilities
		//
		vm.oimp                   = vm.opportunity.phases.implementation;
		vm.oinp                   = vm.opportunity.phases.inception;
		vm.oprp                   = vm.opportunity.phases.proto;
		CapabilitiesMethods.init (vm, vm.opportunity, capabilities);
		vm.imp = {};
		vm.inp = {};
		vm.prp = {};
		CapabilitiesMethods.init (vm.imp, vm.oimp, capabilities);
		CapabilitiesMethods.init (vm.inp, vm.oinp, capabilities);
		CapabilitiesMethods.init (vm.prp, vm.oprp, capabilities);
		CapabilitiesMethods.dump (vm.inp);
		//
		// what capabilities are required ?
		//
		var allclist = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12','c13'];
		vm.clist = [];
		allclist.forEach (function (id) {
			if (vm.opportunity[id+'_minimumYears']>0) {
				vm.clist.push (id);
			}
		});
		//
		// am I watchng?
		//
		vm.isWatching  = OpportunitiesCommon.isWatchng (vm.opportunity);
		vm.addWatch    = function () {vm.isWatching = OpportunitiesCommon.addWatch (vm.opportunity);};
		vm.removeWatch = function () {vm.isWatching = OpportunitiesCommon.removeWatch (vm.opportunity);};
		//
		// what can the user do here?
		//
		var isUser                 = Authentication.user;
		var isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov                  = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.isGov                   = isGov;
		vm.hasEmail                = isUser && Authentication.user.email !== '';
		var isMemberOrWaiting      = opportunity.userIs.member || opportunity.userIs.request;
		vm.loggedIn                = isUser;
		vm.canRequestMembership    = isGov && !isMemberOrWaiting;
		vm.canEdit                 = isAdmin || opportunity.userIs.admin;
		vm.isMember                = opportunity.userIs.member;
		vm.isSprintWithUs          = (vm.opportunity.opportunityTypeCd === 'sprint-with-us');
		vm.showProposals           = vm.canEdit && vm.opportunity.isPublished;
		vm.isAdmin				   = isAdmin;
		//
		// dates
		//
		var rightNow               = new Date ();
		vm.closing = 'CLOSED';
		var d                      = vm.opportunity.deadline - rightNow;
		if (d > 0) {
			var dd = Math.floor(d / 86400000); // days
			var dh = Math.floor((d % 86400000) / 3600000); // hours
			var dm = Math.round(((d % 86400000) % 3600000) / 60000); // minutes
			vm.closing = dm+' minutes';
			if (dd > 0) vm.closing = dd+' days '+dh+' hours '+dm+' minutes';
			else if (dh > 0) vm.closing = dh+' hours '+dm+' minutes';
			else vm.closing = dm+' minutes';
		}
		var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var dt = vm.opportunity.deadline;
		vm.deadline = dt.getHours()+':00 PST, '+dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
		dt = vm.opportunity.assignment;
		vm.assignment = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
		dt = vm.opportunity.start;
		vm.start = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
		// -------------------------------------------------------------------------
		//
		// can this be published?
		//
		// -------------------------------------------------------------------------
		vm.errorFields = OpportunitiesCommon.publishStatus (vm.opportunity);
		vm.canPublish = (vm.errorFields.length === 0);
		// -------------------------------------------------------------------------
		//
		// issue a request for membership
		//
		// -------------------------------------------------------------------------
		vm.request = function () {
			OpportunitiesService.makeRequest ({
				opportunityId: opportunity._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Successfully Applied!' });
			})
		};
		// -------------------------------------------------------------------------
		//
		// constants for evaluation stages for swu proposals
		//
		// -------------------------------------------------------------------------
		vm.stages = {
			new        		: 0,
			pending_review	: 1,
			questions  		: 2,
			questions_saved : 3,
			code_scores		: 4,
			interview  		: 5,
			price      		: 6,
			assigned   		: 7,
			all_fail		: 8
		};
		vm.beforeStage = function (stage) {
			return vm.opportunity.evaluationStage < vm.stages[stage];
		}
		vm.pastStage = function (stage) {
			return vm.opportunity.evaluationStage > vm.stages[stage];
		};
		vm.stageIs = function (stage) {
			return vm.opportunity.evaluationStage === vm.stages[stage];
		};
		vm.weights = {
			price: 0.1,
			interview: 0.25,
			question: 0.2,
			skill: 0.2,
			codechallenge: 0.25
		};
		vm.maxPoints = 100;
		vm.getTopProposal = function() {
			if (vm.proposals && vm.proposals.length > 0) {
				vm.totalAndSort();
				return vm.proposals[0];
			}
			return null;
		}
		// -------------------------------------------------------------------------
		//
		// Evaluate question rankings or calculate skill points
		//
		// -------------------------------------------------------------------------
		var buildQuestionPivot = function () {
			if (!vm.canEdit) return;
			ProposalsService.forOpportunity ({opportunityId:vm.opportunity._id}).$promise
			.then (function (proposals) {
				vm.proposals = proposals;
				// vm.canProgress ();
				//
				// removed hack as this is now in the right place in the edit opportunity
				//
				//
				// make an array of responses (question objects) by question
				//
				vm.responses = [];
				var questionIndex;
				for (questionIndex=0; questionIndex<vm.opportunity.questions.length; questionIndex++) {
					vm.responses[questionIndex] = [];
					vm.proposals.forEach (function (proposal) {
						if (vm.opportunity.evaluationStage === vm.stages.pending_review || !proposal.questions[questionIndex].rejected) {
							vm.responses[questionIndex].push (proposal.questions[questionIndex])
						}
					});
				}
				//
				// if we have not yet begun evaluating do some question order randomizing
				//
				if (vm.opportunity.evaluationStage === vm.stages.new && vm.closing === 'CLOSED') {
					vm.responses.forEach (function (qset) {
						//
						// randomize the responses
						//
						qset.forEach (function (resp) {
							resp.rank = Math.floor((Math.random() * 1000) + 1);
						});
						//
						// now resolve those to 1 through whatever
						//
						qset.sort (function (a, b) {
							if (a.rank < b.rank) return -1;
							else if (a.rank > b.rank) return 1;
							else return 0;
						});
						for (var i=0; i<qset.length; i++) {
							qset[i].rank = i+1;
						}
					});
					//
					// and now figure out the team score, hopefully only once
					//
					var maxScore = vm.opportunity.phases.aggregate.capabilitySkills.length;
					vm.proposals.forEach (function (proposal) {
						var p = {};
						proposal.phases.aggregate.capabilitySkills.forEach (function (skillid) {
							p[skillid.toString()] = true;
						});
						proposal.scores.skill = 0;
						vm.opportunity.phases.aggregate.capabilitySkills.forEach (function (skill) {
							if (p[skill._id.toString()]) proposal.scores.skill++;
						});
						if (maxScore > 0) {
							proposal.scores.skill = Math.round((proposal.scores.skill / maxScore) * (vm.weights.skill * vm.maxPoints) * 100) / 100;
						}
						else {
							proposal.scores.skill = 0;
						}
					});
					//
					// save all the proposals now with the new question rankings if applicable
					// also because this will cause scoring to run on each proposal as well
					//
					vm.totalAndSort();
					vm.opportunity.evaluationStage = vm.stages.pending_review;
					vm.saveOpportunity ();
					vm.saveProposals ();
				}
			});
		};
		buildQuestionPivot ();
		vm.resetEvaluation = function () {

			var q = 'WARNING: This will reset the current evaluation and any calculations or entered data will be lost.  Proceed?';
			ask.yesNo (q).then (function (r) {
				if (r) {
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
						proposal.questions.forEach(function(question) {
							question['rejected'] = false;
						})
					})
					vm.totalAndSort();
					vm.saveProposals();
					vm.saveOpportunity();
				}
			});
		};
		vm.completeQuestionReview = function() {

			var q = 'WARNING: This will open up the evaluation to the opportunity owner.  Proceed?';
			ask.yesNo (q).then (function (r) {
				if (r) {

					vm.opportunity.evaluationStage = vm.stages.questions;
					vm.saveOpportunity();
				}
			});
		}
		// -------------------------------------------------------------------------
		//
		// Questions Modal
		//
		// -------------------------------------------------------------------------
		vm.questions = function () {
			modalService.showModal ({
				size: 'lg',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-questions.html',
				controller: function ($scope, $uibModalInstance) {

					$scope.data                = {};
					$scope.data.questions      = [];
					$scope.data.proposals      = vm.proposals;
					$scope.data.nproposals     = vm.proposals.length;
					$scope.data.questions      = vm.opportunity.questions;
					$scope.data.responses      = vm.responses;
					$scope.data.totalQuestions = vm.opportunity.questions.length;
					$scope.data.currentPage    = 1;

					vm.responses.forEach(function(question, questionIndex) {
						question.forEach(function(response, responseIndex) {
							$scope.data.responses[questionIndex][responseIndex].sanitizedResponse = $sce.trustAsHtml(response.response);
						})
					})

					$scope.data.model = {
						selected: null,
						questions: {}
					};

					$scope.data.responses.forEach(function(respArray) {

						// set initial order by current ranking
						respArray.sort(function(a, b) {
							return a.rank - b.rank;
						});
						$scope.data.model.questions[respArray[0].question] = respArray;
					})
					$scope.pageChanged = function() {
						$scope.data.model.selected = null;
					}

					$scope.close = function () {
						$uibModalInstance.close({});
					};
					$scope.ok = function () {
						$uibModalInstance.close({
							action: 'save',
							questions: $scope.data.model.questions
						});
					};
					$scope.commit = function () {
						var q = 'Are you sure you wish to commmit this ranking session? Ensure you have completed ranking all questions.  This action cannot be undone.';
						ask.yesNo (q).then (function (r) {
							if (r) {
								$uibModalInstance.close({
									action: 'commit',
									questions: $scope.data.model.questions
								});
							}
						});
					};
					$scope.inserted = function(item, index) {
						// ensure item just dropped remains selected
						item.sanitizedResponse = $sce.trustAsHtml(item.response);
						$scope.data.model.selected = item;
					};
				}
			}, {
			})
			.then (function (resp) {

				// commit selected ordering to proposals
				// this nastiness is necessary as the drag and drop widget deep clones objects, so we have to match up original
				// question/response objects by id and update the originals
				if (resp.questions) {
					vm.proposals.forEach(function(proposal) {
						proposal.questions.forEach(function(question) {
							var match = resp.questions[question.question].find(function(response) {
								return question._id === response._id;
							});

							if (match) {
								question.rank = resp.questions[question.question].indexOf(match) + 1;
							}
						})
					})
				}

				if (resp.action === 'save') {
					vm.saveProposals ();
					vm.opportunity.evaluationStage = vm.stages.questions_saved;
				}
				if (resp.action === 'commit') {
					vm.proposals.forEach(function(proposal) {
						vm.questionScore(proposal);
					});
					vm.totalAndSort();
					vm.calculateRankings();
					vm.saveProposals ();
					vm.opportunity.evaluationStage = vm.stages.code_scores;
					vm.saveOpportunity ();
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// Totals and sorts the proposals highest to lowest based on current score
		//
		// -------------------------------------------------------------------------
		vm.totalAndSort = function() {
			vm.proposals.forEach(function(proposal) {
				proposal.scores.total = Math.round((proposal.scores.skill + proposal.scores.question + proposal.scores.codechallenge + proposal.scores.interview + proposal.scores.price) * 100) / 100;
			});

			vm.proposals.sort(function(a, b) {
				return b.scores.total - a.scores.total;
			});
		}
		// -------------------------------------------------------------------------
		//
		// Calculates rankings so that top 4 companies can be screened in - assumes the proposal are already sorted by current score
		//
		// * Teams that tie in points are considered to be in the same position
		// * The highest scoring team following a tie will be considered to be in the position relative to the other teams
		// * (If two teams tie for 1st, the next team will be in 3rd)
		//
		// -------------------------------------------------------------------------
		vm.calculateRankings = function () {
			var currentRanking = 0;
			var prevScore;
			vm.proposals.forEach(function(proposal) {
				currentRanking++;
				proposal.ranking = (proposal.scores.total === prevScore) ? currentRanking -1 : currentRanking;
				prevScore = proposal.scores.total;
				proposal.ranking > 4 ? proposal.screenedIn = false : proposal.screenedIn = true;
			})
		}
		// -------------------------------------------------------------------------
		//
		// Code Challenge Modal
		//
		// -------------------------------------------------------------------------
		vm.codeChallenge = function () {
			modalService.showModal ({
				size: 'sm',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-code-challenge.html',
				controller: function ($scope, $uibModalInstance) {
					$scope.data = {};
					$scope.data.proposalScores = [];
					vm.proposals.forEach(function(proposal) {
						if (proposal.screenedIn) {
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
					var passCount = 0;
					resp.proposalScores.forEach(function(score) {
						var match = vm.proposals.find(function(proposal) {
							return proposal.businessName === score.businessName;
						});

						if (match) {
							if (score.score / 25 >= 0.8) {
								match.passedCodeChallenge = true;
								match.scores.codechallenge = Math.round((score.score / 25) * (vm.weights.codechallenge * vm.maxPoints) * 100) / 100;
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
					vm.totalAndSort();
					vm.saveProposals();
					vm.saveOpportunity();
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// Company Info Modal
		//
		// -------------------------------------------------------------------------
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
		// -------------------------------------------------------------------------
		//
		// Question vetting ranking helper function
		//
		// -------------------------------------------------------------------------
		vm.recalculateRankings = function() {
			vm.responses.forEach(function(responseArray) {
				var rejectedResponses = responseArray.filter(function(response) {
					return response.rejected;
				});

				rejectedResponses.forEach(function(rejResponse) {
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
		}
		// -------------------------------------------------------------------------
		//
		// Question vetting modal
		//
		// -------------------------------------------------------------------------
		vm.openQuestionVetting = function() {
			modalService.showModal({
				size: 'md',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-question-vetting.html',
				controller: function($scope, $uibModalInstance) {
					$scope.data				   = {};
					$scope.data.questions      = [];
					$scope.data.proposals      = vm.proposals;
					$scope.data.nproposals     = vm.proposals.length;
					$scope.data.questions      = vm.opportunity.questions;
					$scope.data.responses      = vm.responses;
					$scope.data.totalQuestions = vm.opportunity.questions.length;
					$scope.data.currentPage    = 1;

					vm.responses.forEach(function(question, questionIndex) {
						question.forEach(function(response, responseIndex) {
							$scope.data.responses[questionIndex][responseIndex].sanitizedResponse = $sce.trustAsHtml(response.response);
						})
					})

					// vm.responses.forEach(function(response, index) {
					// 	$scope.data.responses[index][0].sanitizedResponse = $sce.trustAsHtml(response[0].response);
					// });

					$scope.close = function () {
						$uibModalInstance.close({});
					};
					$scope.ok = function () {
						$uibModalInstance.close({
							action: 'save'
						});
					};
					$scope.commit = function () {
						var q = 'Are you sure you wish to commmit your validation? Ensure you have reviewed all questions.  This action cannot be undone.';
						ask.yesNo (q).then (function (r) {
							if (r) {
								$uibModalInstance.close({
									action: 'commit'
								});
							}
						});
					};

					$scope.getWordCount = function (response) {
						return response.split(' ').length;
					}
				}
			})
			.then(function (resp) {
				if (resp.action === 'save') {
					// save validations on responses, but do not end vetting stage
					vm.recalculateRankings();
					vm.saveProposals();
				}
				else if (resp.action === 'commit') {
					// save validations on responses, and end vetting stage
					vm.recalculateRankings();
					vm.opportunity.evaluationStage = vm.stages.questions;
					vm.saveProposals();
					vm.saveOpportunity();
					buildQuestionPivot();
				}
			});
		}
		// -------------------------------------------------------------------------
		//
		// Interview Modal
		//
		// -------------------------------------------------------------------------
		vm.interview = function () {
			modalService.showModal ({
				size: 'sm',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-interview.html',
				controller: function ($scope, $uibModalInstance) {
					$scope.data = {};
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
							match.scores.interview = Math.round((score.score / 25)  * (vm.weights.interview * vm.maxPoints) * 100) / 100;
							scoreCount++;
						}
					});

					// if we have scored all proposal for the interview stage, calculate price scores
					if (scoreCount === vm.proposals.filter(function(proposal) { return proposal.screenedIn && proposal.passedCodeChallenge; }).length) {
						vm.calculatePriceScores();
						vm.opportunity.evaluationStage++;
					}
					vm.totalAndSort();
					vm.saveProposals();
					vm.saveOpportunity();
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// save all the proposals (rankings etc)
		//
		// -------------------------------------------------------------------------
		vm.saveProposal = function (proposal) {
			if (!vm.canEdit) return;
			// vm.calculateProposalScore (proposal);
			return proposal.createOrUpdate ();
		};
		vm.saveProposals = function () {
			if (!vm.canEdit) return;
			Promise.all (vm.proposals.map (function (proposal) {
				return vm.saveProposal (proposal);
			}))
			.then (function () {
				buildQuestionPivot ();
			});
		};
		vm.saveOpportunity = function () {
			if (!vm.canEdit) return;
			vm.opportunity.$update ();
		};
		//
		// skills are scored when the proposal is saved
		//
		vm.skillScore = function (proposal) {
			return proposal.scores.skill;
		};
		//
		// just pass it back
		//
		vm.interviewScore = function (proposal) {
			return proposal.scores.interview;
		};
		//
		// since the ranking is from 1 - n we want to invert it and then add up and
		// give a percent over best possible score
		//
		// n = number of proposals
		// m = number of questions
		// Q(r) = question ranking (will be from 1 to n with 1 being the best)
		//
		// score = sum ( (n+1)-Q(r) ) / (n * m) * 400
		//
		// Rejected questions are not considered in the scoring
		vm.questionScore = function (proposal) {
			var bestScore = vm.opportunity.questions.length * vm.proposals.length;
			proposal.scores.question = Math.round(
				proposal.questions
				// filter out rejected questions
				.filter(function (q) {
					return !q.rejected;
				})
				.map (function (q) {
					return vm.proposals.length + 1 - q.rank;
				}).reduce (function (a, b) {
					return a + b;
				}) / bestScore * (vm.weights.question * vm.maxPoints) * 100) / 100;
			return proposal.scores.question;
		};

		vm.priceScore = function (proposal) {
			return proposal.scores.price;
		};

		vm.calculatePriceScores = function () {
			var lowestBidder;
			var passedProposals = vm.proposals.filter(function(proposal) {
				return proposal.screenedIn && proposal.passedCodeChallenge;
			})

			passedProposals.forEach(function(proposal) {
				proposal.cost = proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost;
				if (lowestBidder === undefined || proposal.cost < lowestBidder.cost) {
					lowestBidder = proposal;
				}
			})

			passedProposals.forEach(function(proposal) {
				proposal.scores.price = Math.round((lowestBidder.cost/proposal.cost) * (vm.weights.price * vm.maxPoints) * 100) / 100;
			})
		};

		vm.assign = function (proposal) {
			var q = 'Are you sure you want to assign this opportunity to this proponent?';
			ask.yesNo (q).then (function (r) {
				if (r) {
					ProposalsService.assignswu (proposal).$promise
					.then (
						function (response) {
							vm.proposal = response;
							Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i> Company has been assigned'});
							$state.go ('opportunities.viewswu',{opportunityId:vm.opportunity.code});
							vm.opportunity.evaluationStage = vm.stages.assigned;
							vm.opportunity.proposal = proposal;
							vm.saveOpportunity ();
							proposal.isAssigned = true;
							vm.saveProposal (proposal);
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Proposal Assignment failed!' });
						}
					);
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// publish or un publish the opportunity
		//
		// -------------------------------------------------------------------------
		vm.publish = function (opportunity, isToBePublished) {
			var publishedState  = opportunity.isPublished;
			var publishError    = 'Error ' + (isToBePublished ? 'Publishing' : 'Unpublishing');
			var publishQuestion = 'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?';
			var publishSuccess  = isToBePublished ? 'Your opportunity has been published and we\'ve notified subscribers!' : 'Your opportunity has been unpublished!'
			var publishMethod   = isToBePublished ? OpportunitiesService.publish : OpportunitiesService.unpublish;
			var isToBeSaved     = true;
			var promise = Promise.resolve ();
			if (isToBePublished) promise = ask.yesNo (publishQuestion).then (function (r) {isToBeSaved = r;});
			promise.then (function () {
				if (isToBeSaved) {
					opportunity.isPublished = isToBePublished;
					publishMethod ({opportunityId:opportunity._id}).$promise
					.then (function () {
						//
						// success, notify
						//
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> '+publishSuccess
						});
					})
					.catch (function (res) {
						//
						// fail, notify and stay put
						//
						opportunity.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> '+publishError
						});
					});
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// sign in and apply
		//
		// -------------------------------------------------------------------------
		vm.signInAndApply = function () {
			$state.go('authentication.signin').then(function () {
				$state.previous = {
					state: 'opportunities.viewswu',
					params: {opportunityId:opportunity.code},
					href: $state.href('opportunities.viewswu', {opportunityId:opportunity.code})
				};
			});
		};
		// -------------------------------------------------------------------------
		//
		// unassign an opportunitu
		//
		// -------------------------------------------------------------------------
		vm.unassign = function () {
			var opportunity = vm.opportunity;
			var q = 'Are you sure you want to un-assign this proponent from this opportunity ?';
			ask.yesNo (q).then (function (r) {
				if (r) {
					OpportunitiesService.unassign ({opportunityId:opportunity._id}).$promise
					.then (
						function (response) {
							vm.opportunity = response;
							Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Proposal Un-Assignment successful!'});
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Proposal Un-Assignment failed!' });
						}
					);
				}
			});
		};
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityEditSWUController', function ($scope, capabilities, $state, $stateParams, $window, $sce, opportunity, editing, projects, Authentication, Notification, dataService, modalService, $q, ask, uibButtonConfig, CapabilitySkillsService, CapabilitiesMethods, TINYMCE_OPTIONS, OpportunitiesCommon) {
		uibButtonConfig.activeClass = 'custombuttonbackground';
		var vm                      = this;
		vm.trust                    = $sce.trustAsHtml;
		// vm.features                 = window.features;
		var originalPublishedState  = opportunity.isPublished;
		//
		// what can the user do here?
		//
		var isUser                       = Authentication.user;
		vm.isAdmin                       = isUser && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov                         = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.projects                      = projects;
		vm.editing                       = editing;
		vm.opportunity                   = opportunity;
		vm.opportunity.opportunityTypeCd = 'sprint-with-us';
		if (!vm.opportunity.phases) {
			vm.opportunity.phases = {
				implementation : {},
				inception : {},
				proto : {}
			}
		}
		vm.oimp                   = vm.opportunity.phases.implementation;
		vm.oinp                   = vm.opportunity.phases.inception;
		vm.oprp                   = vm.opportunity.phases.proto;
		vm.oagg                   = vm.opportunity.phases.aggregate;
		vm.opportunity.deadline   = new Date (vm.opportunity.deadline);
		vm.opportunity.assignment = new Date (vm.opportunity.assignment);
		vm.opportunity.start      = new Date (vm.opportunity.start)		;
		vm.opportunity.endDate    = new Date (vm.opportunity.endDate)	;
		vm.oimp.endDate           = new Date (vm.oimp.endDate  );
		vm.oimp.startDate         = new Date (vm.oimp.startDate);
		vm.oinp.endDate           = new Date (vm.oinp.endDate       );
		vm.oinp.startDate         = new Date (vm.oinp.startDate     );
		vm.oprp.endDate           = new Date (vm.oprp.endDate       );
		vm.oprp.startDate         = new Date (vm.oprp.startDate     );
		vm.authentication         = Authentication;
		vm.form                   = {};
		vm.opportunity.skilllist  = vm.opportunity.skills ? vm.opportunity.skills.join (', ') : '';
		vm.closing				  = 'CLOSED';
		vm.closing 				  = ((vm.opportunity.deadline - new Date()) > 0) ? 'OPEN' : 'CLOSED';

		// viewmodel items related to team questions
		vm.teamQuestions		  	= vm.opportunity.teamQuestions;
		vm.teamQuestions.forEach(function(teamQuestion) {
			teamQuestion.cleanQuestion 	= $sce.trustAsHtml(teamQuestion.question);
			teamQuestion.cleanGuideline = $sce.trustAsHtml(teamQuestion.guideline);
			teamQuestion.newQuestion = false;
		});
		vm.editingTeamQuestion	  	= false;
		vm.teamQuestionEditIndex  	= -1;
		vm.currentTeamQuestionText	= '';
		vm.currentGuidelineText		= '';
		vm.currentQuestionWordLimit = 300;
		vm.currentQuestionScore		= 5;

		// Adding a new team question
		// We a new one to the list and enter edit mode
		vm.addNewTeamQuestion = function() {
			vm.teamQuestions.push({
				question: '',
				guideline: '',
				wordLimit: 300,
				questionScore: 5,
				newQuestion: true
			});

			vm.currentTeamQuestionText = '';
			vm.currentGuidelinText = '';
			vm.currentQuestionWordLimit = 300;
			vm.currentQuestionScore = 5;
			vm.teamQuestionEditIndex = vm.teamQuestions.length - 1;
			vm.editingTeamQuestion = true;
		}
		// Cancel edit team question
		vm.cancelEditTeamQuestion = function() {
			if (vm.editingTeamQuestion) {

				// if this was a brand new question, remove it
				if (vm.teamQuestions[vm.teamQuestionEditIndex].newQuestion === true) {
					vm.teamQuestions.splice(vm.teamQuestionEditIndex, 1);
				}

				// discard changes
				vm.currentTeamQuestionText = '';
				vm.currentGuidelineText = '';
				vm.editingTeamQuestion = false;
			}
		}
		// Enter edit mode for an existing team question
		vm.editTeamQuestion = function(index) {
			vm.teamQuestionEditIndex = index;
			var currentTeamQuestion = vm.teamQuestions[vm.teamQuestionEditIndex];
			vm.currentTeamQuestionText = currentTeamQuestion.question;
			vm.currentGuidelineText = currentTeamQuestion.guideline;
			vm.currentQuestionWordLimit = currentTeamQuestion.wordLimit;
			vm.currentQuestionScore = currentTeamQuestion.questionScore;
			vm.editingTeamQuestion = true;
		}
		// Save edit team question
		vm.saveEditTeamQuestion = function() {
			var curTeamQuestion = vm.teamQuestions[vm.teamQuestionEditIndex];
			if (curTeamQuestion) {
				curTeamQuestion.question = vm.currentTeamQuestionText;
				curTeamQuestion.guideline = vm.currentGuidelineText;
				curTeamQuestion.wordLimit = vm.currentQuestionWordLimit;
				curTeamQuestion.questionScore = vm.currentQuestionScore;
				curTeamQuestion.cleanQuestion = $sce.trustAsHtml(vm.currentTeamQuestionText);
				curTeamQuestion.cleanGuideline = $sce.trustAsHtml(vm.currentGuidelineText);
				curTeamQuestion.newQuestion = false;
			}

			vm.editingTeamQuestion = false;
		}

		// Delete team question with confirm modal
		vm.deleteTeamQuestion = function(index) {
			if (index >= 0 && index < vm.teamQuestions.length) {
				var q = 'Are you sure you wish to delete this team question from the opportunity?';
				ask.yesNo (q).then (function (r) {
					if (r) {
						vm.teamQuestions.splice(index, 1);
					}
				});
			}
		}

		// viewmodel items related to addendum
		vm.addenda 			  	  = vm.opportunity.addenda;
		vm.addenda.forEach(function(addendum) {
			addendum.cleanDesc = $sce.trustAsHtml(addendum.description);
		})
		vm.editingAddenda		  = false;
		vm.addendaEditIndex		  = -1;
		vm.currentAddendaText	  = '';

		// Adding a new addendum
		// We add a new one to the list and enter edit mode
		vm.addNewAddendum = function() {
			vm.addenda.push({
				description: '',
				createdBy: Authentication.user,
				createdOn: Date.now()
			});

			vm.currentAddendaText = '';
			vm.addendaEditIndex = vm.addenda.length - 1;
			vm.editingAddenda = true;
		}
		// Cancel edit addendum
		vm.cancelEditAddendum = function() {
			if (vm.editingAddenda) {
				vm.addenda.splice(vm.addendaEditIndex, 1);
				vm.editingAddenda = false;
			}
		}
		// Save the addendum being edited
		vm.saveEditAddendum = function() {
			var curAddenda = vm.addenda[vm.addendaEditIndex];
			if (curAddenda) {
				curAddenda.description = vm.currentAddendaText;
				curAddenda.createdBy = Authentication.user;
				curAddenda.createdOn = Date.now();
				curAddenda.cleanDesc = $sce.trustAsHtml(vm.currentAddendaText);
			}

			vm.editingAddenda = false;
		}
		// Delete an addendum with confirm modal
		vm.deleteAddenda = function(index) {
			if (index >= 0 && index < vm.addenda.length) {
				var q = 'Are you sure you wish to delete this addendum?';
				ask.yesNo (q).then (function (r) {
					if (r) {
						vm.addenda.splice(index, 1);
					}
				});
			}
		}
		//
		// Every time we enter here until the opportunity has been published we will update the questions to the most current
		//
		if (!vm.isPublished) vm.opportunity.questions = dataService.questions;
		//
		// set up the structures for capabilities
		//
		vm.imp = {};
		vm.inp = {};
		vm.prp = {};
		vm.all = {};
		CapabilitiesMethods.init (vm.all, {}, capabilities);
		CapabilitiesMethods.init (vm.imp, vm.oimp, capabilities, 'implementation');
		CapabilitiesMethods.init (vm.inp, vm.oinp, capabilities, 'inception');
		CapabilitiesMethods.init (vm.prp, vm.oprp, capabilities, 'prototype');
		CapabilitiesMethods.dump (vm.all);
		//
		// set up capabilities
		//
		// -------------------------------------------------------------------------
		//
		// can this be published?
		//
		// -------------------------------------------------------------------------
		vm.errorFields = OpportunitiesCommon.publishStatus (vm.opportunity);
		vm.canPublish = vm.errorFields > 0;
		//
		// set up the dropdown amounts for code with us earnings
		//
		var minAmount = 500;
		var maxAmount = 70000;
		var step      = 500;
		vm.amounts = [];
		var i;
		for (i = minAmount; i <= maxAmount; i += step) vm.amounts.push (i);


		if (!vm.opportunity.opportunityTypeCd || vm.opportunity.opportunityTypeCd === '') vm.opportunity.opportunityTypeCd = 'code-with-us';
		// if (!vm.opportunity.capabilities) vm.opportunity.capabilities = [];
		//
		// if the user doesn't have the right access then kick them out
		//
		if (editing && !vm.isAdmin && !opportunity.userIs.admin) $state.go('forbidden');
		//
		// do we have existing contexts for program and project ?
		// deal with all that noise right here
		//
		vm.projectLink            = true;
		vm.context                = $stateParams.context || 'allopportunities';
		vm.programId              = $stateParams.programId || null;
		vm.programTitle           = $stateParams.programTitle || null;
		vm.projectId              = $stateParams.projectId || null;
		vm.projectTitle           = $stateParams.projectTitle || null;
		//
		// cities list
		//
		vm.cities = dataService.cities;
		//
		// if editing, set from existing
		//
		if (vm.editing) {
			vm.programId    = opportunity.program._id;
			vm.programTitle = opportunity.program.title;
			vm.projectId    = opportunity.project._id;
			vm.projectTitle = opportunity.project.name;
		}
		else {
			if (vm.context === 'allopportunities') {
				vm.projectLink  = false;
			}
			else if (vm.context === 'program') {
				vm.projectLink         = false;
				vm.opportunity.program = vm.programId;
				var lprojects           = [];
				vm.projects.forEach (function (o) {
					if (o.program._id === vm.programId) lprojects.push (o);
				});
				vm.projects = lprojects;
			}
			else if (vm.context === 'project') {
				vm.projectLink         = true;
				vm.opportunity.project = vm.projectId;
				vm.opportunity.program = vm.programId;
			}
			//
			// if not editing, set some conveinient default dates
			//
			vm.opportunity.deadline                        = new Date ();
			vm.opportunity.assignment                      = new Date ();
			vm.opportunity.start                           = new Date ();
			vm.opportunity.endDate                         = new Date ();
			vm.oimp.endDate   = new Date ();
			vm.oimp.startDate = new Date ();
			vm.oinp.endDate        = new Date ();
			vm.oinp.startDate      = new Date ();
			vm.oprp.endDate    = new Date ();
			vm.oprp.startDate  = new Date ();

		}
		//
		// if there are no available projects then post a warning and kick the user back to
		// where they came from
		//
		if (vm.projects.length === 0) {
			Notification.error ({message : 'You do not have a project for which you are able to create an opportunity. Please browse to or create a project to put the new opportunity under.'});
			$state.go ('opportunities.list');
		}
		//
		// if there is only one available project just force it
		//
		else if (vm.projects.length === 1) {
			vm.projectLink         = true;
			vm.projectId           = vm.projects[0]._id;
			vm.projectTitle        = vm.projects[0].name;
			vm.opportunity.project = vm.projectId;
			vm.programId           = vm.projects[0].program._id;
			vm.programTitle        = vm.projects[0].program.title;
			vm.opportunity.program = vm.programId;
		}

		vm.tinymceOptions = TINYMCE_OPTIONS;

		// -------------------------------------------------------------------------
		//
		// if the skills tab was selected we need to collapse all the capabilities and
		// currently selected skills into the aggregate
		//
		// NOTE HACK IMPORTANT:
		// The way this is implemented is very simplistic. the aggregate views of
		// capabilties and skills are generated, and then when a skill is selected
		// it is set in EACH AND EVERY phase, regadless of whether or not the capability
		// the skill is under is represented in that phase. This will propogate to the
		// database, but it does not matter as skills are treated in aggrerate anyhow.
		// However, it is important to note in case skills become viewed on a per phase
		// basis rather than in aggregate
		//
		// -------------------------------------------------------------------------
		vm.selectSkills = function (e) {
			//
			// go through all the possible capabilities and indicate which ones were chosen
			// in the aggregate
			//
			Object.keys(vm.all.iCapabilities).forEach (function (code) {
				vm.all.iOppCapabilities[code] = vm.inp.iOppCapabilities[code] || vm.prp.iOppCapabilities[code] ||  vm.imp.iOppCapabilities[code];
			});
			//
			// same with the most current view of skills
			//
			Object.keys(vm.all.iCapabilitySkills).forEach (function (code) {
				vm.all.iOppCapabilitySkills[code] = vm.inp.iOppCapabilitySkills[code] || vm.prp.iOppCapabilitySkills[code] ||  vm.imp.iOppCapabilitySkills[code];
			});
		};
		vm.changeTargets = function () {
			vm.opportunity.inceptionTarget = Number (vm.opportunity.inceptionTarget);
			vm.opportunity.prototypeTarget = Number (vm.opportunity.prototypeTarget);
			vm.opportunity.implementationTarget = Number (vm.opportunity.implementationTarget);
			vm.opportunity.totalTarget = vm.opportunity.inceptionTarget+vm.opportunity.prototypeTarget+vm.opportunity.implementationTarget;
		};
		vm.totalTargets = function () {
			return 1234;
		};
		// -------------------------------------------------------------------------
		//
		// these do things to balance the years required and desired when clicked
		//
		// -------------------------------------------------------------------------
		vm.smin = function (mfield, dfield, value) {
			if (vm.opportunity[dfield] < value) vm.opportunity[dfield] = value;
		};
		vm.sdes = function (dfield, mfield, value) {
			if (vm.opportunity[mfield] > value) vm.opportunity[mfield] = value;
		};
		// -------------------------------------------------------------------------
		//
		// this is used when we are setting the entire hierarchy from the project
		// select box
		//
		// -------------------------------------------------------------------------
		vm.updateProgramProject = function () {
			vm.projectId    = vm.projectobj._id;
			vm.projectTitle = vm.projectobj.name;
			vm.programId    = vm.projectobj.program._id;
			vm.programTitle = vm.projectobj.program.title;
		};
		// -------------------------------------------------------------------------
		//
		// remove the opportunity with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = function () {
			if ($window.confirm('Are you sure you want to delete?')) {
				vm.opportunity.$remove(function() {
					$state.go('opportunities.list');
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> opportunity deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the opportunity, could be added or edited (post or put)
		//
		// CC: changes to questions about notifications - we decided to simply warn
		// about publishing and not link it to notifying, but only to saving
		// so the question is really "do you want to publish"?
		// and also remove all doNotNotify stuff
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {

			if (!vm.opportunity.name) {
				Notification.error ({
					message : 'You must enter a title for your opportunity',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Errors on Page'
				});
				return false;
			}
			//
			// budget canot exceed 2 million
			//
			if (vm.opportunity.budget > 2000000) {
				Notification.error ({
					message : 'You cannot enter an overall budget greater than $2,000,000',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Errors on Page'
				});
				return false;
			}
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.opportunityForm');
				Notification.error ({
					message : 'There are errors on the page, please review your work and re-save',
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> Errors on Page'
				});
				return false;
			}
			if (vm.opportunity.skilllist && vm.opportunity.skilllist !== '') {
				vm.opportunity.skills = vm.opportunity.skilllist.split(/ *, */);
			} else {
				vm.opportunity.skills = [];
			}
			//
			// deal with capabilities
			//
			CapabilitiesMethods.reconcile (vm.inp, vm.oinp);
			CapabilitiesMethods.reconcile (vm.prp, vm.oprp);
			CapabilitiesMethods.reconcile (vm.imp, vm.oimp);
			//
			// if any context pieces were being set then copy in to the
			// right place here (only when adding)
			//
			if (!vm.editing) {
				if (vm.context === 'allopportunities') {
					vm.opportunity.project = vm.projectId;
					vm.opportunity.program = vm.programId;
				}
				else if (vm.context === 'program') {
					vm.opportunity.project = vm.projectId;
				}
			}
			//
			// ensure that there is a trailing '/' on the github field
			//
			if (vm.opportunity.github && vm.opportunity.github.substr (-1, 1) !== '/') vm.opportunity.github += '/';
			//
			// set the time on the 2 dates that care about it
			//
			vm.opportunity.deadline.setHours(16);
			vm.opportunity.assignment.setHours(16);
			if (!vm.opportunity.endDate) vm.opportunity.endDate = new Date ();
			vm.opportunity.endDate.setHours(16);
			vm.oimp.endDate.setHours (16);
			vm.oimp.startDate.setHours (16);
			vm.oinp.endDate.setHours (16);
			vm.oinp.startDate.setHours (16);
			vm.oprp.endDate.setHours (16);
			vm.oprp.startDate.setHours (16);


			//
			// confirm save only if the user is also publishing
			//
			var savemeSeymour = true;
			var promise = Promise.resolve ();
			if (!originalPublishedState && vm.opportunity.isPublished) {
				var question = 'You are publishing this opportunity. This will also notify all subscribed users.  Do you wish to continue?'
				promise = ask.yesNo (question).then (function (result) {
					savemeSeymour = result;
				});
			}
			//
			// update target total
			//
			vm.opportunity.totalTarget = vm.opportunity.implementationTarget + vm.opportunity.prototypeTarget + vm.opportunity.inceptionTarget
			//
			// Create a new opportunity, or update the current instance
			//
			promise.then(function() {
				if (savemeSeymour) {
					return vm.opportunity.createOrUpdate();
				}
				else return Promise.reject ({data:{message:'Publish Cancelled'}});
			})
			//
			// success, notify and return to list
			//
			.then (function () {
				vm.opportunityForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> opportunity saved successfully!'
				});

				$state.go('opportunities.viewswu', {opportunityId:opportunity.code});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> opportunity save error!'
				});
			});

		};
		vm.popoverCache = {};
		vm.displayHelp = {};
		vm.popoverContent       = function(field) {
			if (! field) return;
			if (! vm.popoverCache[field]) {
				var help = $('#opportunityForm').find('.input-help[data-field='+field+']');
				var	html = (help.length) ? help.html () : '';
				vm.popoverCache[field] = $sce.trustAsHtml(html);
			}
			return vm.popoverCache[field];
		};
		vm.toggleHelp = function(field) {
			vm.displayHelp[field] = ! vm.displayHelp[field];
		};
	})
	;
}());
