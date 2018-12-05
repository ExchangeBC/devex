'use strict';

// Import certain style elements here so that webpack picks them up
import angular from 'angular';
import _ from 'lodash';
import '../css/opportunities.css';

(() => {
	angular
		.module('opportunities')

		// Controller for editing the opportunity page
		.controller('OpportunityEditSWUController', [
			'$scope',
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
			'CapabilitiesService',
			'TINYMCE_OPTIONS',
			'OpportunitiesCommon',
			'OpportunitiesService',
			function(
				$scope,
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
				CapabilitiesService,
				TINYMCE_OPTIONS,
				OpportunitiesCommon,
				OpportunitiesService
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

				vm.opportunity.deadline = new Date(vm.opportunity.deadline);
				vm.opportunity.assignment = new Date(vm.opportunity.assignment);
				vm.opportunity.start = new Date(vm.opportunity.start);
				vm.opportunity.endDate = new Date(vm.opportunity.endDate);
				vm.opportunity.phases.inception.startDate = new Date(vm.opportunity.phases.inception.startDate);
				vm.opportunity.phases.inception.endDate = new Date(vm.opportunity.phases.inception.endDate);
				vm.opportunity.phases.proto.startDate = new Date(vm.opportunity.phases.proto.startDate);
				vm.opportunity.phases.proto.endDate = new Date(vm.opportunity.phases.proto.endDate);
				vm.opportunity.phases.implementation.startDate = new Date(vm.opportunity.phases.implementation.startDate);
				vm.opportunity.phases.implementation.endDate = new Date(vm.opportunity.phases.implementation.endDate);
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

				// Every time we enter here until the opportunity has been published we will update the questions to the most current
				if (!vm.isPublished) {
					vm.opportunity.questions = dataService.questions;
				}

				// Returns a boolean indicating whether the given phase is included in the opportunity or not
				vm.isPhaseIncluded = phase => {
					if (phase === vm.opportunity.phases.inception) {
						return phase.isInception;
					} else if (phase === vm.opportunity.phases.proto) {
						return phase.isPrototype;
					} else if (phase === vm.opportunity.phases.implementation) {
						return phase.isImplementation;
					}
				};

				// Changes the given phase to be the start phase, and adjust the status of the other phases accordingly
				vm.changeToStartPhase = phase => {
					if (phase === vm.opportunity.phases.inception) {
						vm.opportunity.phases.inception.isInception = true;
						vm.opportunity.phases.proto.isPrototype = true;
						vm.opportunity.phases.implementation.isImplementation = true;
					} else if (phase === vm.opportunity.phases.proto) {
						vm.opportunity.phases.inception.isInception = false;
						vm.inceptionCapabilities.forEach(cap => {
							vm.toggleSelectedCapability(cap, vm.inceptionCapabilities);
						});
						vm.opportunity.phases.proto.isPrototype = true;
						vm.opportunity.phases.implementation.isImplementation = true;
					} else if (phase === vm.opportunity.phases.implementation) {
						vm.opportunity.phases.inception.isInception = false;
						vm.inceptionCapabilities.forEach(cap => {
							vm.toggleSelectedCapability(cap, vm.inceptionCapabilities);
						});
						vm.opportunity.phases.proto.isPrototype = false;
						vm.prototypeCapabilities.forEach(cap => {
							vm.toggleSelectedCapability(cap, vm.prototypeCapabilities);
						});
						vm.opportunity.phases.implementation.isImplementation = true;
					}
				};

				// Function for gathering capabilities, core capabilities on the opportunity
				// so that they can be displayed, selected
				vm.refreshCapabilities = () => {
					// Retrieve a list of the complete capability set available
					vm.allCapabilities = CapabilitiesService.list();

					// Retrieve currently selected skills and capabilities from opportunity
					vm.capabilitySkills = OpportunitiesCommon.getTechnicalSkills(opportunity);

					vm.inceptionCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.inception);
					vm.inceptionCoreCaps = OpportunitiesCommon.getCoreCapabilitiesForPhase(opportunity.phases.inception);
					vm.inceptionSkills = OpportunitiesCommon.getTechnicalSkillsForPhase(opportunity.phases.inception);

					vm.prototypeCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.proto);
					vm.prototypeCoreCaps = OpportunitiesCommon.getCoreCapabilitiesForPhase(opportunity.phases.proto);
					vm.prototypeSkills = OpportunitiesCommon.getTechnicalSkillsForPhase(opportunity.phases.proto);

					vm.implementationCapabilities = OpportunitiesCommon.getCapabilitiesForPhase(opportunity.phases.implementation);
					vm.implementationCoreCaps = OpportunitiesCommon.getCoreCapabilitiesForPhase(opportunity.phases.implementation);
					vm.implementationSkills = OpportunitiesCommon.getTechnicalSkillsForPhase(opportunity.phases.implementation);
				};

				// Returns boolean indicating whether the given capability is selected for the given phase (if one is given)
				// If no phase is provided, return boolean indicating whether capability is selected for any phase
				vm.isCapabilitySelected = (capability, capList?) => {
					if (capList) {
						return capList.map(cap => cap.code).indexOf(capability.code) !== -1;
					}
					return (
						_.union(vm.inceptionCapabilities, vm.prototypeCapabilities, vm.implementationCapabilities)
							.map((cap: any) => cap.code)
							.indexOf(capability.code) !== -1
					);
				};

				// Toggles the selection for the given capability for the given phase by adding it or removing it from list for that phase
				vm.toggleSelectedCapability = (capability, capList) => {
					if (vm.isCapabilitySelected(capability, capList)) {
						_.remove(capList, (cap: any) => cap.code === capability.code);

						// Deselect any selected skills associated with the removed capability
						let skillList;
						if (capList === vm.inceptionCapabilities) {
							skillList = vm.inceptionSkills;
						} else if (capList === vm.prototypeCapabilities) {
							skillList = vm.prototypeSkills;
						} else if (capList === vm.implementationCapabilities) {
							skillList = vm.implementationSkills;
						}

						capability.skills.forEach(skill => {
							_.remove(skillList, (sk: any) => sk._id === skill._id);

							// Reaggregate the complete skill list
							vm.capabilitySkills = _.unionWith(vm.inceptionSkills, vm.prototypeSkills, vm.implementationSkills, (a: any, b: any) => a._id === b._id);
						});
					} else {
						capList.push(capability);
					}
				};

				// Returns boolean indicating whether the given skill is a selected preferred skill or not
				vm.isSkillSelected = skill => {
					return vm.capabilitySkills.map(sk => sk.code).indexOf(skill.code) !== -1;
				};

				vm.toggleSelectedSkill = (capability, skill) => {
					// If skill is selected, remove it from master skill list and all phase lists
					// Otherwise, add it to master, and add it to each of the phase lists that has the parent capability
					if (vm.isSkillSelected(skill)) {
						_.remove(vm.capabilitySkills, (sk: any) => sk.code === skill.code);
						_.remove(vm.inceptionSkills, (sk: any) => sk.code === skill.code);
						_.remove(vm.prototypeSkills, (sk: any) => sk.code === skill.code);
						_.remove(vm.implementationSkills, (sk: any) => sk.code === skill.code);
					} else {
						vm.capabilitySkills.push(skill);
						if (vm.isCapabilitySelected(capability, vm.inceptionCapabilities)) {
							vm.inceptionSkills.push(skill);
						}
						if (vm.isCapabilitySelected(capability, vm.prototypeCapabilities)) {
							vm.prototypeSkills.push(skill);
						}
						if (vm.isCapabilitySelected(capability, vm.implementationCapabilities)) {
							vm.implementationSkills.push(skill);
						}
					}
				};

				vm.refreshCapabilities();

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
					vm.opportunity.phases.implementation.endDate = new Date();
					vm.opportunity.phases.implementation.startDate = new Date();
					vm.opportunity.phases.inception.endDate = new Date();
					vm.opportunity.phases.inception.startDate = new Date();
					vm.opportunity.phases.proto.endDate = new Date();
					vm.opportunity.phases.proto.startDate = new Date();
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

				vm.changeTargets = () => {
					vm.opportunity.inceptionTarget = Number(vm.opportunity.inceptionTarget);
					vm.opportunity.prototypeTarget = Number(vm.opportunity.prototypeTarget);
					vm.opportunity.implementationTarget = Number(vm.opportunity.implementationTarget);
					vm.opportunity.totalTarget = vm.opportunity.inceptionTarget + vm.opportunity.prototypeTarget + vm.opportunity.implementationTarget;
				};

				vm.totalTargets = () => {
					return 1234;
				};

				// these do things to balance the years required and desired when clicked
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

				// this is used when we are setting the entire hierarchy from the project
				// select box
				vm.updateProgramProject = () => {
					vm.projectId = vm.projectobj._id;
					vm.projectTitle = vm.projectobj.name;
					vm.programId = vm.projectobj.program._id;
					vm.programTitle = vm.projectobj.program.title;
				};

				// remove the opportunity with some confirmation
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

				// save the opportunity, could be added or edited (post or put)
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

					// validate the budget and phase cost maximums
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
					vm.opportunity.phases.implementation.endDate.setHours(16);
					vm.opportunity.phases.implementation.endDate.setMinutes(0);
					vm.opportunity.phases.implementation.endDate.setSeconds(0);
					vm.opportunity.phases.implementation.startDate.setHours(16);
					vm.opportunity.phases.implementation.startDate.setMinutes(0);
					vm.opportunity.phases.implementation.startDate.setSeconds(0);
					vm.opportunity.phases.inception.endDate.setHours(16);
					vm.opportunity.phases.inception.endDate.setMinutes(0);
					vm.opportunity.phases.inception.endDate.setSeconds(0);
					vm.opportunity.phases.inception.startDate.setHours(16);
					vm.opportunity.phases.inception.startDate.setMinutes(0);
					vm.opportunity.phases.inception.startDate.setSeconds(0);
					vm.opportunity.phases.proto.endDate.setHours(16);
					vm.opportunity.phases.proto.endDate.setMinutes(0);
					vm.opportunity.phases.proto.endDate.setSeconds(0);
					vm.opportunity.phases.proto.startDate.setHours(16);
					vm.opportunity.phases.proto.startDate.setMinutes(0);
					vm.opportunity.phases.proto.startDate.setSeconds(0);

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
								return OpportunitiesService.update(vm.opportunity).$promise;
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
