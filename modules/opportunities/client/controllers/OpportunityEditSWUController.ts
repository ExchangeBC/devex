'use strict';

// Import certain style elements here so that webpack picks them up
import angular from 'angular';
import _ from 'lodash';
import moment from 'moment';
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
				CapabilitiesService,
				TINYMCE_OPTIONS,
				OpportunitiesCommon,
				OpportunitiesService
			) {
				const vm = this;
				const isUser = Authentication.user;
				const codeChallengeDefaultWeight = 0.35;
				const skillDefaultWeight = 0.05;
				const questionDefaultWeight = 0.25;
				const interviewDefaultWeight = 0.25;
				const priceDefaultWeight = 0.1;

				vm.isAdmin = isUser && Authentication.user.roles.indexOf('admin') !== -1;
				vm.isGov = isUser && Authentication.user.roles.indexOf('gov') !== -1;
				vm.projects = projects;
				vm.editing = editing;
				vm.authentication = Authentication;
				vm.form = {};
				vm.closing = 'CLOSED';
				vm.editingTeamQuestion = false;
				vm.teamQuestionEditIndex = -1;
				vm.currentTeamQuestionText = '';
				vm.currentGuidelineText = '';
				vm.currentQuestionWordLimit = 300;
				vm.currentQuestionScore = 5;
				vm.editingAddenda = false;
				vm.addendaEditIndex = -1;
				vm.currentAddendaText = '';
				vm.tinymceOptions = TINYMCE_OPTIONS;
				vm.cities = dataService.cities;

				// do we have existing contexts for program and project?
				vm.projectLink = true;
				vm.context = $stateParams.context || 'allopportunities';
				vm.programId = $stateParams.programId || null;
				vm.programTitle = $stateParams.programTitle || null;
				vm.projectId = $stateParams.projectId || null;
				vm.projectTitle = $stateParams.projectTitle || null;

				// Load the current opportunity into the view
				const loadOpportunity = opp => {
					vm.opportunity = opp;
					vm.opportunity.opportunityTypeCd = 'sprint-with-us';

					// Initialize phases for new opportunities
					if (!vm.opportunity.phases) {
						vm.opportunity.phases = {
							implementation: {
								isImplementation: true,
								capabilities: [],
								capabilitiesCore: [],
								capabilitiesSkills: []
							},
							inception: {
								isInception: true,
								capabilities: [],
								capabilitiesCore: [],
								capabilitiesSkills: []
							},
							proto: {
								isPrototype: true,
								capabilities: [],
								capabilitiesCore: [],
								capabilitiesSkills: []
							}
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

					// Format strings into dates so Angular doesn't complain
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

					// Update closing flag
					vm.closing = vm.opportunity.deadline - new Date().getTime() > 0 ? 'OPEN' : 'CLOSED';

					// Load team questions
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

					// Load addenda
					if (!vm.opportunity.addenda) {
						vm.opportunity.addenda = [];
					}
					vm.addenda = vm.opportunity.addenda;
					vm.addenda.forEach(addendum => {
						addendum.cleanDesc = $sce.trustAsHtml(addendum.description);
					});

					// If the user doesn't have the right access then kick them out
					if (editing && !vm.isAdmin && !opp.userIs.admin) {
						$state.go('forbidden');
					}

					// Can this opportunity be published?
					vm.errorFields = OpportunitiesCommon.publishStatus(vm.opportunity);
					vm.canPublish = vm.errorFields > 0;

					// if editing, set from existing
					if (editing) {
						vm.programId = opp.program._id;
						vm.programTitle = opp.program.title;
						vm.projectId = opp.project._id;
						vm.projectTitle = opp.project.name;
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

						// If not editing, set some conveinient default dates
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
				};
				// Immediately load in the passed in opportunity
				loadOpportunity(opportunity);

				// Set the times on the opportunity dates to a specified time
				const setTimes = (opp, hour, minute, second) => {
					opp.deadline = moment(opp.deadline)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.assignment = moment(opp.assignment)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.endDate = !vm.opportunity.endDate ? new Date() : opp.endDate;
					opp.endDate = moment(opp.endDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.implementation.endDate = moment(opp.phases.implementation.endDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.implementation.startDate = moment(opp.phases.implementation.startDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.inception.endDate = moment(opp.phases.inception.endDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.inception.startDate = moment(opp.phases.inception.startDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.proto.endDate = moment(opp.phases.proto.endDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();

					opp.phases.proto.startDate = moment(opp.phases.proto.startDate)
						.set({ hour: parseInt(hour, 10), minute: parseInt(minute, 10), second: parseInt(second, 10) })
						.toDate();
				};

				// Load question weights into readable form
				const loadWeights = () => {
					vm.skillsPercentage = vm.opportunity.weights.skill * 100;
					vm.questionPercentage = vm.opportunity.weights.question * 100;
					vm.codeChallengePercentage = vm.opportunity.weights.codechallenge * 100;
					vm.teamScenarioPercentage = vm.opportunity.weights.interview * 100;
					vm.pricePercentage = vm.opportunity.weights.price * 100;
					vm.totalPercentage = vm.skillsPercentage + vm.questionPercentage + vm.codeChallengePercentage + vm.teamScenarioPercentage + vm.pricePercentage;
				};
				loadWeights();

				const validateBudget = () => {
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
				};

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

						vm.opportunity.phases.inception.capabilities = [];
						vm.opportunity.phases.inception.capabilitiesCore = [];
						vm.inceptionSkills.map(vm.toggleSelectedSkill);

						vm.opportunity.phases.proto.isPrototype = true;
						vm.opportunity.phases.implementation.isImplementation = true;
					} else if (phase === vm.opportunity.phases.implementation) {
						vm.opportunity.phases.inception.isInception = false;

						vm.opportunity.phases.inception.capabilities = [];
						vm.opportunity.phases.inception.capabilitiesCore = [];
						vm.inceptionSkills.map(vm.toggleSelectedSkill);

						vm.opportunity.phases.proto.isPrototype = false;

						vm.opportunity.phases.proto.capabilities = [];
						vm.opportunity.phases.proto.capabilitiesCore = [];
						vm.prototypeSkills.map(vm.toggleSelectedSkill);
						vm.opportunity.phases.implementation.isImplementation = true;
					}
				};

				// Function for gathering capabilities, core capabilities on the opportunity
				// so that they can be displayed, selected
				vm.refreshCapabilities = () => {
					// Retrieve a list of the complete capability set available
					vm.allCapabilities = CapabilitiesService.list();

					vm.inceptionCapabilities = vm.opportunity.phases.inception.capabilities;
					vm.inceptionCoreCaps = vm.opportunity.phases.inception.capabilitiesCore;
					vm.inceptionSkills = vm.opportunity.phases.inception.capabilitySkills;

					vm.prototypeCapabilities = vm.opportunity.phases.proto.capabilities;
					vm.prototypeCoreCaps = vm.opportunity.phases.proto.capabilitiesCore;
					vm.prototypeSkills = vm.opportunity.phases.proto.capabilitySkills;

					vm.implementationCapabilities = vm.opportunity.phases.implementation.capabilities;
					vm.implementationCoreCaps = vm.opportunity.phases.implementation.capabilitiesCore;
					vm.implementationSkills = vm.opportunity.phases.implementation.capabilitySkills;
				};
				vm.refreshCapabilities();

				// Returns boolean indicating whether the given capability is selected for the given phase (if one is given)
				// If no phase is provided, return boolean indicating whether capability is selected for any phase
				vm.isCapabilitySelected = (capability, phaseCapList?) => {
					if (phaseCapList) {
						return phaseCapList.map(cap => cap.code).indexOf(capability.code) !== -1;
					} else {
						return (
							_.union(vm.inceptionCapabilities, vm.prototypeCapabilities, vm.implementationCapabilities)
								.map((cap: any) => cap.code)
								.indexOf(capability.code) !== -1
						);
					}
				};

				// Toggles the selection for the given capability for the given phase by adding it or removing it from list for that phase
				vm.toggleSelectedCapability = (capability, phaseCapList) => {
					// If the phase contains the capability, remove it, otherwise, add it in
					if (vm.isCapabilitySelected(capability, phaseCapList)) {
						_.remove(phaseCapList, (cap: any) => cap.code === capability.code);

						// if not a core capabilities list,
						// remove associated skills from ALL skill lists
						// (since we are using an aggregated approah to skill selection)
						if ([vm.inceptionCoreCaps, vm.prototypeCoreCaps, vm.implementationCoreCaps].indexOf(phaseCapList) === -1) {
							capability.skills.forEach(skill => {
								_.remove(vm.inceptionSkills, (sk: any) => sk.code === skill.code);
								_.remove(vm.prototypeSkills, (sk: any) => sk.code === skill.code);
								_.remove(vm.implementationSkills, (sk: any) => sk.code === skill.code);
							});
						}
					} else {
						phaseCapList.push(capability);
					}
				};

				// Returns boolean indicating whether the given skill is a selected preferred skill or not
				vm.isSkillSelected = skill => {
					return (
						_.union(vm.inceptionSkills, vm.prototypeSkills, vm.implementationSkills)
							.map((sk: any) => sk.code)
							.indexOf(skill.code) !== -1
					);
				};

				vm.toggleSelectedSkill = skill => {
					// If it's selected, remove it from all lists
					if (vm.isSkillSelected(skill)) {
						_.remove(vm.inceptionSkills, (sk: any) => sk.code === skill.code);
						_.remove(vm.prototypeSkills, (sk: any) => sk.code === skill.code);
						_.remove(vm.implementationSkills, (sk: any) => sk.code === skill.code);
					} else {
						// Find the capability the skill belongs to
						const parentCap = vm.allCapabilities.find(cap => {
							return cap.skills.map(sk => sk.code).indexOf(skill.code) !== -1;
						});

						// Find the phases where the parent capability is selected and add it to the corresponding skill list for that phase
						if (vm.inceptionCapabilities.map(cap => cap.code).indexOf(parentCap.code !== -1)) {
							vm.inceptionSkills.push(skill);
						}

						if (vm.prototypeCapabilities.map(cap => cap.code).indexOf(parentCap.code !== -1)) {
							vm.prototypeSkills.push(skill);
						}

						if (vm.implementationCapabilities.map(cap => cap.code).indexOf(parentCap.code !== -1)) {
							vm.implementationSkills.push(skill);
						}
					}
				};

				// if there are no available projects then post a warning and kick the user back to
				// where they came from
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

				vm.changeTargets = () => {
					vm.opportunity.inceptionTarget = Number(vm.opportunity.inceptionTarget);
					vm.opportunity.prototypeTarget = Number(vm.opportunity.prototypeTarget);
					vm.opportunity.implementationTarget = Number(vm.opportunity.implementationTarget);
					vm.opportunity.totalTarget = vm.opportunity.inceptionTarget + vm.opportunity.prototypeTarget + vm.opportunity.implementationTarget;
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
					const question = 'Please confirm you want to delete this opportunity';
					ask.yesNo(question).then(response => {
						if (response) {
							OpportunitiesService.remove({ opportunityId: vm.opportunity.code }).$promise.then(() => {
								$state.go('opportunities.list');
								Notification.success({
									title: 'Success',
									message: '<i class="fas fa-check-circle"></i> Opportunity deleted'
								});
							});
						}
					});
				};

				// save the opportunity, could be added or edited (post or put)
				vm.save = isValid => {
					if (!vm.opportunity.name) {
						Notification.error({
							title: 'Error',
							message: "<i class='fas fa-exclamation-triangle'></i> You must enter a title for your opportunity"
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
							title: 'Error',
							message: "<i class='fas fa-exclamation-triangle'></i> There are errors on the page, please review your work and re-save"
						});
						return false;
					}

					// if new opportunity, link to project and program
					if (!vm.editing) {
						vm.opportunity.project = vm.projectId;
						vm.opportunity.program = vm.programId;
					}

					// ensure that there is a trailing '/' on the github field
					if (vm.opportunity.github && vm.opportunity.github.substr(-1, 1) !== '/') {
						vm.opportunity.github += '/';
					}

					setTimes(vm.opportunity, 16, 0, 0);

					// update target total
					vm.opportunity.totalTarget = vm.opportunity.implementationTarget + vm.opportunity.prototypeTarget + vm.opportunity.inceptionTarget;

					// if this is a published opportunity, confirm save as this generates notifications
					Promise.resolve()
						.then(() => {
							return new Promise(resolve => {
								if (vm.opportunity.isPublished) {
									const question = 'Saving a published opportunity will notify subscribed users.  Proceed with save?';
									resolve(ask.yesNo(question));
								} else {
									resolve(true);
								}
							});
						})
						// Proceed with save or cancel
						.then(saving => {
							if (saving) {
								if (editing) {
									return OpportunitiesService.update({ opportunityId: vm.opportunity.code }, vm.opportunity).$promise;
								} else {
									return OpportunitiesService.save({}, vm.opportunity).$promise;
								}

							} else {
								throw new Error('Save cancelled');
							}
						})
						// Handle save done
						.then(savedOpportunity => {
							vm.opportunityForm.$setPristine();
							loadOpportunity(savedOpportunity);

							let successMessage;
							if (vm.opportunity.isPublished) {
								successMessage = '<i class="fas fa-check-circle"></i> Opportunity saved and subscribers notified';
							} else {
								successMessage = '<i class="fas fa-check-circle"></i> Opportunity saved';
							}

							Notification.success({
								title: 'Success',
								message: successMessage
							});

							if (!editing) {
								$state.go('opportunityadmin.editswu', { opportunityId: vm.opportunity.code });
							}
						})
						// Handle cancel or error
						.catch(res => {
							Notification.error({
								title: 'Opportunity not saved',
								message: res.message
							});
						});
				};
			}
		]);
})();
