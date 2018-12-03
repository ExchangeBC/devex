'use strict';

// Import certain style elements here so that webpack picks them up
import angular from 'angular';
import '../css/opportunities.css';

(() => {
	angular
		.module('opportunities')

		// Controller for editing the opportunity page
		.controller('OpportunityEditSWUController', [
			'$scope',
			'capabilities',
			'$state',
			'$stateParams',
			'$window',
			'$sce',
			'opportunity',
			'editing',
			'projects',
			'Authentication',
			'Notification',
			'dataService',
			'ask',
			'uibButtonConfig',
			'CapabilitiesMethods',
			'TINYMCE_OPTIONS',
			'OpportunitiesCommon',
			function(
				$scope,
				capabilities,
				$state,
				$stateParams,
				$window,
				$sce,
				opportunity,
				editing,
				projects,
				Authentication,
				Notification,
				dataService,
				ask,
				uibButtonConfig,
				CapabilitiesMethods,
				TINYMCE_OPTIONS,
				OpportunitiesCommon
			) {
				uibButtonConfig.activeClass = 'custombuttonbackground';
				const vm = this;
				vm.trust = $sce.trustAsHtml;
				const originalPublishedState = opportunity.isPublished;

				const isUser = Authentication.user;
				vm.isAdmin = isUser && Authentication.user.roles.indexOf('admin') !== -1;
				vm.isGov = isUser && Authentication.user.roles.indexOf('gov') !== -1;
				vm.projects = projects;
				vm.editing = editing;
				vm.opportunity = opportunity;
				vm.opportunity.opportunityTypeCd = 'sprint-with-us';

				const codeChallengeDefaultWeight = 0.35;
				const skillDefaultWeight = 0.05;
				const questionDefaultWeight = 0.25;
				const interviewDefaultWeight = 0.25;
				const priceDefaultWeight = 0.1;

				// Initialize phases for new opportunities
				if (!vm.opportunity.phases) {
					vm.opportunity.phases = {
						implementation: {},
						inception: {},
						proto: {}
					};
				}

				// Set default weights for new opportunities
				if (!vm.opportunity.weights) {
					vm.opportunity.weights = {
						codechallenge: codeChallengeDefaultWeight,
						skill: skillDefaultWeight,
						question: questionDefaultWeight,
						interview: interviewDefaultWeight,
						price: priceDefaultWeight
					};
				}

				vm.oimp = vm.opportunity.phases.implementation;
				vm.oinp = vm.opportunity.phases.inception;
				vm.oprp = vm.opportunity.phases.proto;
				vm.oagg = vm.opportunity.phases.aggregate;
				vm.opportunity.deadline = new Date(vm.opportunity.deadline);
				vm.opportunity.assignment = new Date(vm.opportunity.assignment);
				vm.opportunity.start = new Date(vm.opportunity.start);
				vm.opportunity.endDate = new Date(vm.opportunity.endDate);
				vm.oimp.endDate = new Date(vm.oimp.endDate);
				vm.oimp.startDate = new Date(vm.oimp.startDate);
				vm.oinp.endDate = new Date(vm.oinp.endDate);
				vm.oinp.startDate = new Date(vm.oinp.startDate);
				vm.oprp.endDate = new Date(vm.oprp.endDate);
				vm.oprp.startDate = new Date(vm.oprp.startDate);
				vm.authentication = Authentication;
				vm.form = {};
				vm.opportunity.skilllist = vm.opportunity.skills ? vm.opportunity.skills.join(', ') : '';
				vm.closing = 'CLOSED';
				vm.closing = vm.opportunity.deadline - new Date().getTime() > 0 ? 'OPEN' : 'CLOSED';

				// viewmodel items related to team questions
				if (!vm.opportunity.teamQuestions) {
					vm.opportunity.teamQuestions = [];
				}
				vm.teamQuestions = vm.opportunity.teamQuestions;
				vm.teamQuestions.forEach(teamQuestion => {
					teamQuestion.cleanQuestion = $sce.trustAsHtml(teamQuestion.question);
					teamQuestion.cleanGuideline = $sce.trustAsHtml(teamQuestion.guideline);
					teamQuestion.newQuestion = false;
				});
				vm.editingTeamQuestion = false;
				vm.teamQuestionEditIndex = -1;
				vm.currentTeamQuestionText = '';
				vm.currentGuidelineText = '';
				vm.currentQuestionWordLimit = 300;
				vm.currentQuestionScore = 5;

				// Load question weights into readable form
				loadWeights();
				function loadWeights() {
					vm.skillsPercentage = vm.opportunity.weights.skill * 100;
					vm.questionPercentage = vm.opportunity.weights.question * 100;
					vm.codeChallengePercentage = vm.opportunity.weights.codechallenge * 100;
					vm.teamScenarioPercentage = vm.opportunity.weights.interview * 100;
					vm.pricePercentage = vm.opportunity.weights.price * 100;
					vm.totalPercentage = vm.skillsPercentage + vm.questionPercentage + vm.codeChallengePercentage + vm.teamScenarioPercentage + vm.pricePercentage;
				}

				// Save edited scoring weights for evaluation to the opportunity (does not save the opportunity itself)
				vm.saveWeights = () => {
					vm.totalPercentage = vm.skillsPercentage + vm.questionPercentage + vm.codeChallengePercentage + vm.teamScenarioPercentage + vm.pricePercentage;

					if (isNaN(vm.totalPercentage)) {
						vm.totalPercentage = 0;
						return;
					}

					if (vm.totalPercentage === 100) {
						vm.opportunity.weights.skill = vm.skillsPercentage / 100;
						vm.opportunity.weights.question = vm.questionPercentage / 100;
						vm.opportunity.weights.codechallenge = vm.codeChallengePercentage / 100;
						vm.opportunity.weights.interview = vm.teamScenarioPercentage / 100;
						vm.opportunity.weights.price = vm.pricePercentage / 100;
					}
				};

				// Adding a new team question
				// We a new one to the list and enter edit mode
				vm.addNewTeamQuestion = () => {
					vm.teamQuestions.push({
						question: '',
						guideline: '',
						wordLimit: 300,
						questionScore: 5,
						newQuestion: true
					});

					vm.currentTeamQuestionText = '';
					vm.currentGuidelineText = '';
					vm.currentQuestionWordLimit = 300;
					vm.currentQuestionScore = 5;
					vm.teamQuestionEditIndex = vm.teamQuestions.length - 1;
					vm.editingTeamQuestion = true;
				};
				// Cancel edit team question
				vm.cancelEditTeamQuestion = () => {
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
				};
				// Enter edit mode for an existing team question
				vm.editTeamQuestion = index => {
					vm.teamQuestionEditIndex = index;
					const currentTeamQuestion = vm.teamQuestions[vm.teamQuestionEditIndex];
					vm.currentTeamQuestionText = currentTeamQuestion.question;
					vm.currentGuidelineText = currentTeamQuestion.guideline;
					vm.currentQuestionWordLimit = currentTeamQuestion.wordLimit;
					vm.currentQuestionScore = currentTeamQuestion.questionScore;
					vm.editingTeamQuestion = true;
				};
				// Save edit team question
				vm.saveEditTeamQuestion = () => {
					const curTeamQuestion = vm.teamQuestions[vm.teamQuestionEditIndex];
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
				};

				// Delete team question with confirm modal
				vm.deleteTeamQuestion = index => {
					if (index >= 0 && index < vm.teamQuestions.length) {
						const q = 'Are you sure you wish to delete this team question from the opportunity?';
						ask.yesNo(q).then(r => {
							if (r) {
								vm.teamQuestions.splice(index, 1);
							}
						});
					}
				};

				// viewmodel items related to addendum
				if (!vm.opportunity.addenda) {
					vm.opportunity.addenda = [];
				}
				vm.addenda = vm.opportunity.addenda;
				vm.addenda.forEach(addendum => {
					addendum.cleanDesc = $sce.trustAsHtml(addendum.description);
				});
				vm.editingAddenda = false;
				vm.addendaEditIndex = -1;
				vm.currentAddendaText = '';

				// Adding a new addendum
				// We add a new one to the list and enter edit mode
				vm.addNewAddendum = () => {
					vm.addenda.push({
						description: '',
						createdBy: Authentication.user,
						createdOn: Date.now()
					});

					vm.currentAddendaText = '';
					vm.addendaEditIndex = vm.addenda.length - 1;
					vm.editingAddenda = true;
				};
				// Cancel edit addendum
				vm.cancelEditAddendum = () => {
					if (vm.editingAddenda) {
						vm.addenda.splice(vm.addendaEditIndex, 1);
						vm.editingAddenda = false;
					}
				};
				// Save the addendum being edited
				vm.saveEditAddendum = () => {
					const curAddenda = vm.addenda[vm.addendaEditIndex];
					if (curAddenda) {
						curAddenda.description = vm.currentAddendaText;
						curAddenda.createdBy = Authentication.user;
						curAddenda.createdOn = Date.now();
						curAddenda.cleanDesc = $sce.trustAsHtml(vm.currentAddendaText);
					}

					vm.editingAddenda = false;
				};
				// Delete an addendum with confirm modal
				vm.deleteAddenda = index => {
					if (index >= 0 && index < vm.addenda.length) {
						const q = 'Are you sure you wish to delete this addendum?';
						ask.yesNo(q).then(r => {
							if (r) {
								vm.addenda.splice(index, 1);
							}
						});
					}
				};
				//
				// Every time we enter here until the opportunity has been published we will update the questions to the most current
				//
				if (!vm.isPublished) {
					vm.opportunity.questions = dataService.questions;
				}
				//
				// set up the structures for capabilities
				//
				vm.imp = {};
				vm.inp = {};
				vm.prp = {};
				vm.all = {};
				CapabilitiesMethods.init(vm.all, {}, capabilities);
				CapabilitiesMethods.init(vm.imp, vm.oimp, capabilities, 'implementation');
				CapabilitiesMethods.init(vm.inp, vm.oinp, capabilities, 'inception');
				CapabilitiesMethods.init(vm.prp, vm.oprp, capabilities, 'prototype');
				CapabilitiesMethods.dump(vm.all);

				//
				// set up capabilities
				//
				// -------------------------------------------------------------------------
				//
				// can this be published?
				//
				// -------------------------------------------------------------------------
				vm.errorFields = OpportunitiesCommon.publishStatus(vm.opportunity);
				vm.canPublish = vm.errorFields > 0;
				//
				// set up the dropdown amounts for code with us earnings
				//
				const minAmount = 500;
				const maxAmount = 70000;
				const step = 500;
				vm.amounts = [];
				let i;
				for (i = minAmount; i <= maxAmount; i += step) {
					vm.amounts.push(i);
				}

				if (!vm.opportunity.opportunityTypeCd || vm.opportunity.opportunityTypeCd === '') {
					vm.opportunity.opportunityTypeCd = 'code-with-us';
				}
				// if (!vm.opportunity.capabilities) vm.opportunity.capabilities = [];
				//
				// if the user doesn't have the right access then kick them out
				//
				if (editing && !vm.isAdmin && !opportunity.userIs.admin) {
					$state.go('forbidden');
				}
				//
				// do we have existing contexts for program and project ?
				// deal with all that noise right here
				//
				vm.projectLink = true;
				vm.context = $stateParams.context || 'allopportunities';
				vm.programId = $stateParams.programId || null;
				vm.programTitle = $stateParams.programTitle || null;
				vm.projectId = $stateParams.projectId || null;
				vm.projectTitle = $stateParams.projectTitle || null;
				//
				// cities list
				//
				vm.cities = dataService.cities;
				//
				// if editing, set from existing
				//
				if (vm.editing) {
					vm.programId = opportunity.program._id;
					vm.programTitle = opportunity.program.title;
					vm.projectId = opportunity.project._id;
					vm.projectTitle = opportunity.project.name;
				} else {
					if (vm.context === 'allopportunities') {
						vm.projectLink = false;
					} else if (vm.context === 'program') {
						vm.projectLink = false;
						vm.opportunity.program = vm.programId;
						const lprojects = [];
						vm.projects.forEach(o => {
							if (o.program._id === vm.programId) {
								lprojects.push(o);
							}
						});
						vm.projects = lprojects;
					} else if (vm.context === 'project') {
						vm.projectLink = true;
						vm.opportunity.project = vm.projectId;
						vm.opportunity.program = vm.programId;
					}
					//
					// if not editing, set some conveinient default dates
					//
					vm.opportunity.deadline = new Date();
					vm.opportunity.assignment = new Date();
					vm.opportunity.start = new Date();
					vm.opportunity.endDate = new Date();
					vm.oimp.endDate = new Date();
					vm.oimp.startDate = new Date();
					vm.oinp.endDate = new Date();
					vm.oinp.startDate = new Date();
					vm.oprp.endDate = new Date();
					vm.oprp.startDate = new Date();
				}
				//
				// if there are no available projects then post a warning and kick the user back to
				// where they came from
				//
				if (vm.projects.length === 0) {
					Notification.error({
						message: 'You do not have a project for which you are able to create an opportunity. Please browse to or create a project to put the new opportunity under.'
					});
					$state.go('opportunities.list');
				} else if (vm.projects.length === 1) {
					vm.projectLink = true;
					vm.projectId = vm.projects[0]._id;
					vm.projectTitle = vm.projects[0].name;
					vm.opportunity.project = vm.projectId;
					vm.programId = vm.projects[0].program._id;
					vm.programTitle = vm.projects[0].program.title;
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
				vm.selectSkills = e => {
					//
					// go through all the possible capabilities and indicate which ones were chosen
					// in the aggregate
					//
					Object.keys(vm.all.iCapabilities).forEach(code => {
						vm.all.iOppCapabilities[code] = vm.inp.iOppCapabilities[code] || vm.prp.iOppCapabilities[code] || vm.imp.iOppCapabilities[code];
					});
					//
					// same with the most current view of skills
					//
					Object.keys(vm.all.iCapabilitySkills).forEach(code => {
						vm.all.iOppCapabilitySkills[code] = vm.inp.iOppCapabilitySkills[code] || vm.prp.iOppCapabilitySkills[code] || vm.imp.iOppCapabilitySkills[code];
					});
				};
				vm.changeTargets = () => {
					vm.opportunity.inceptionTarget = Number(vm.opportunity.inceptionTarget);
					vm.opportunity.prototypeTarget = Number(vm.opportunity.prototypeTarget);
					vm.opportunity.implementationTarget = Number(vm.opportunity.implementationTarget);
					vm.opportunity.totalTarget = vm.opportunity.inceptionTarget + vm.opportunity.prototypeTarget + vm.opportunity.implementationTarget;
				};
				vm.totalTargets = () => {
					return 1234;
				};
				// -------------------------------------------------------------------------
				//
				// these do things to balance the years required and desired when clicked
				//
				// -------------------------------------------------------------------------
				vm.smin = (mfield, dfield, value) => {
					if (vm.opportunity[dfield] < value) {
						vm.opportunity[dfield] = value;
					}
				};
				vm.sdes = (dfield, mfield, value) => {
					if (vm.opportunity[mfield] > value) {
						vm.opportunity[mfield] = value;
					}
				};
				// -------------------------------------------------------------------------
				//
				// this is used when we are setting the entire hierarchy from the project
				// select box
				//
				// -------------------------------------------------------------------------
				vm.updateProgramProject = () => {
					vm.projectId = vm.projectobj._id;
					vm.projectTitle = vm.projectobj.name;
					vm.programId = vm.projectobj.program._id;
					vm.programTitle = vm.projectobj.program.title;
				};
				// -------------------------------------------------------------------------
				//
				// remove the opportunity with some confirmation
				//
				// -------------------------------------------------------------------------
				vm.remove = () => {
					if ($window.confirm('Are you sure you want to delete?')) {
						vm.opportunity.$remove(() => {
							$state.go('opportunities.list');
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> opportunity deleted successfully!'
							});
						});
					}
				};

				function validateBudget() {
					if (vm.opportunity.budget > 2000000) {
						Notification.error({
							message: 'You cannot enter an overall budget greater than $2,000,000',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
						});
						return false;
					}

					if (vm.opportunity.phases.inception.isInception && vm.opportunity.phases.inception.maxCost > vm.opportunity.budget) {
						Notification.error({
							message: 'You cannot enter an Inception budget greater than the total budget.',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
						});
						return false;
					}

					if (vm.opportunity.phases.proto.isPrototype && vm.opportunity.phases.proto.maxCost > vm.opportunity.budget) {
						Notification.error({
							message: 'You cannot enter a Proof of Concept budget greater than the total budget.',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
						});
						return false;
					}

					if (vm.opportunity.phases.implementation.maxCost > vm.opportunity.budget) {
						Notification.error({
							message: 'You cannot enter an Implementation budget greater than the total budget.',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
						});
						return false;
					}

					return true;
				}

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
				vm.saveme = () => {
					this.save(true);
				};
				vm.save = isValid => {
					if (!vm.opportunity.name) {
						Notification.error({
							message: 'You must enter a title for your opportunity',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
						});
						return false;
					}
					//
					// validate the budget and phase cost maximums
					//
					if (!validateBudget()) {
						return false;
					}

					// validate the entire form
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.opportunityForm');
						Notification.error({
							message: 'There are errors on the page, please review your work and re-save',
							title: "<i class='fas fa-exclamation-triangle'></i> Errors on Page"
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
					CapabilitiesMethods.reconcile(vm.inp, vm.oinp);
					CapabilitiesMethods.reconcile(vm.prp, vm.oprp);
					CapabilitiesMethods.reconcile(vm.imp, vm.oimp);

					if (!vm.editing) {
						vm.opportunity.project = vm.projectId;
						vm.opportunity.program = vm.programId;
					}
					//
					// ensure that there is a trailing '/' on the github field
					//
					if (vm.opportunity.github && vm.opportunity.github.substr(-1, 1) !== '/') {
						vm.opportunity.github += '/';
					}
					//
					// set the time on the 2 dates that care about it
					//
					vm.opportunity.deadline.setHours(16);
					vm.opportunity.deadline.setMinutes(0);
					vm.opportunity.deadline.setSeconds(0);
					vm.opportunity.assignment.setHours(16);
					if (!vm.opportunity.endDate) {
						vm.opportunity.endDate = new Date();
					}
					vm.opportunity.endDate.setHours(16);
					vm.opportunity.endDate.setMinutes(0);
					vm.opportunity.endDate.setSeconds(0);
					vm.oimp.endDate.setHours(16);
					vm.oimp.endDate.setMinutes(0);
					vm.oimp.endDate.setSeconds(0);
					vm.oimp.startDate.setHours(16);
					vm.oimp.startDate.setMinutes(0);
					vm.oimp.startDate.setSeconds(0);
					vm.oinp.endDate.setHours(16);
					vm.oinp.endDate.setMinutes(0);
					vm.oinp.endDate.setSeconds(0);
					vm.oinp.startDate.setHours(16);
					vm.oinp.startDate.setMinutes(0);
					vm.oinp.startDate.setSeconds(0);
					vm.oprp.endDate.setHours(16);
					vm.oprp.endDate.setMinutes(0);
					vm.oprp.endDate.setSeconds(0);
					vm.oprp.startDate.setHours(16);
					vm.oprp.startDate.setMinutes(0);
					vm.oprp.startDate.setSeconds(0);

					//
					// confirm save only if the user is also publishing
					//
					let savemeSeymour = true;
					let promise = Promise.resolve();
					if (!originalPublishedState && vm.opportunity.isPublished) {
						const question = 'You are publishing this opportunity. This will also notify all subscribed users.  Do you wish to continue?';
						promise = ask.yesNo(question).then(result => {
							savemeSeymour = result;
						});
					}
					//
					// update target total
					//
					vm.opportunity.totalTarget = vm.opportunity.implementationTarget + vm.opportunity.prototypeTarget + vm.opportunity.inceptionTarget;
					//
					// Create a new opportunity, or update the current instance
					//
					promise
						.then(() => {
							if (savemeSeymour) {
								return vm.opportunity.createOrUpdate();
							} else {
								return Promise.reject({ data: { message: 'Publish Cancelled' } });
							}
						})
						//
						// success, notify and return to list
						//
						.then(() => {
							vm.opportunityForm.$setPristine();
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> opportunity saved successfully!'
							});

							$state.go('opportunities.viewswu', { opportunityId: opportunity.code });
						})
						//
						// fail, notify and stay put
						//
						.catch(res => {
							Notification.error({
								message: res.message,
								title: "<i class='fas fa-exclamation-triangle'></i> opportunity save error!"
							});
						});
				};
				vm.popoverCache = {};
				vm.displayHelp = {};
				vm.popoverContent = field => {
					if (!field) {
						return;
					}
					if (!vm.popoverCache[field]) {
						const help = $('#opportunityForm').find('.input-help[data-field=' + field + ']');
						const html = help.length ? help.html() : '';
						vm.popoverCache[field] = $sce.trustAsHtml(html);
					}
					return vm.popoverCache[field];
				};
				vm.toggleHelp = field => {
					vm.displayHelp[field] = !vm.displayHelp[field];
				};
			}
		]);
})();
