'use strict';

import angular from 'angular';

(() => {
	const formatDate = d => {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = d.getDate();
		const monthIndex = d.getMonth();
		const year = d.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', ' + year;
	};

	angular
		.module('proposals')

		// Controller the view of the proposal page
		.controller('ProposalSWUEditController', [
			'capabilities',
			'editing',
			'$scope',
			'$sce',
			'ask',
			'Upload',
			'$state',
			'proposal',
			'opportunity',
			'Authentication',
			'ProposalsService',
			'Notification',
			'CapabilitiesCommon',
			'org',
			'TINYMCE_OPTIONS',
			'resources',
			'$window',
			function(
				capabilities,
				editing,
				$scope,
				$sce,
				ask,
				Upload,
				$state,
				proposal,
				opportunity,
				Authentication,
				ProposalsService,
				Notification,
				CapabilitiesCommon,
				org,
				TINYMCE_OPTIONS,
				resources,
				$window
			) {
				const ppp = this;
				const init = () => {
					ppp.trust = $sce.trustAsHtml;

					ppp.opportunity = opportunity;
					ppp.org = org;
					ppp.members = resources;
					ppp.title = editing ? 'Edit' : 'Create';
					ppp.proposal = proposal;
					ppp.user = Authentication.user;
					if (org) {
						ppp.org.fullAddress = ppp.org.address + (ppp.org.address2 ? ', ' + ppp.org.address2 : '') + ', ' + ppp.org.city + ', ' + ppp.org.province + ', ' + ppp.org.postalcode;
					}
					ppp.proposal.org = org;
					ppp.orgHasMetRFQ = org.metRFQ;
					ppp.agreeConfirm = false;

					ppp.checkBoxModel = {
						value: ppp.proposal.isAcceptedTerms
					};

					// if not editing (i.e. creating), ensure that the current user doesn't already have a proposal started for this opp
					// if they do, transition to edit view for that proposal
					if (!editing) {
						ProposalsService.getMyProposal({ opportunityId: opportunity.code }).$promise
						.then(response => {
							if (response && response._id) {
								$state.go('proposaladmin.editswu', { proposalId: response._id, opportunityId: opportunity.code });
							}
						})
					}

					//
					// this is all the people in the org
					//
					if (!ppp.proposal.phases) {
						ppp.proposal.phases = {
							implementation: {
								isImplementation: false,
								team: [],
								cost: 0
							},
							inception: {
								isInception: false,
								team: [],
								cost: 0
							},
							proto: {
								isPrototype: false,
								team: [],
								cost: 0
							},
							aggregate: {
								team: [],
								cost: 0
							}
						};
					}
					//
					// lazy lazy lazy
					// set up pointers to the proposal phases just so we dont have to type so much
					// and also to the opportunity phases for the same reason
					//
					ppp.p_imp = ppp.proposal.phases.implementation;
					ppp.p_inp = ppp.proposal.phases.inception;
					ppp.p_prp = ppp.proposal.phases.proto;
					ppp.p_agg = ppp.proposal.phases.aggregate;
					ppp.oimp = ppp.opportunity.phases.implementation;
					ppp.oinp = ppp.opportunity.phases.inception;
					ppp.oprp = ppp.opportunity.phases.proto;
					ppp.oagg = ppp.opportunity.phases.aggregate;
					ppp.oimp.f_endDate = formatDate(new Date(ppp.oimp.endDate));
					ppp.oimp.f_startDate = formatDate(new Date(ppp.oimp.startDate));
					ppp.oinp.f_endDate = formatDate(new Date(ppp.oinp.endDate));
					ppp.oinp.f_startDate = formatDate(new Date(ppp.oinp.startDate));
					ppp.oprp.f_endDate = formatDate(new Date(ppp.oprp.endDate));
					ppp.oprp.f_startDate = formatDate(new Date(ppp.oprp.startDate));

					ppp.activeTab = 1;
					ppp.activateTab = tabIndex => {
						ppp.activeTab = tabIndex;
					};

					// set up validators for currency amount validators for each phase
					ppp.exceededOpportunityAmount = false;
					ppp.proposal.phases.inception.invalidAmount = false;
					ppp.proposal.phases.proto.invalidAmount = false;
					ppp.proposal.phases.implementation.invalidAmount = false;

					ppp.validateInceptionAmount = () => {
						ppp.inceptionMax = ppp.opportunity.phases.inception.maxCost;
						if (ppp.proposal.phases.inception.cost < 0 || ppp.proposal.phases.inception.cost > ppp.inceptionMax) {
							ppp.proposal.phases.inception.invalidAmount = true;
						} else {
							ppp.proposal.phases.inception.invalidAmount = false;
						}
						if (ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost > ppp.opportunity.budget) {
							ppp.exceededOpportunityAmount = true;
						} else {
							ppp.exceededOpportunityAmount = false;
						}
					};

					ppp.validatePrototypeAmount = () => {
						ppp.protoMax = ppp.opportunity.phases.proto.maxCost;
						if (ppp.proposal.phases.proto.cost < 0 || ppp.proposal.phases.proto.cost > ppp.protoMax) {
							ppp.proposal.phases.proto.invalidAmount = true;
						} else {
							ppp.proposal.phases.proto.invalidAmount = false;
						}
						if (ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost > ppp.opportunity.budget) {
							ppp.exceededOpportunityAmount = true;
						} else {
							ppp.exceededOpportunityAmount = false;
						}
					};

					ppp.validateImplementationAmount = () => {
						ppp.implMax = ppp.opportunity.phases.implementation.maxCost;
						if (ppp.proposal.phases.implementation.cost < 0 || ppp.proposal.phases.implementation.cost > ppp.implMax) {
							ppp.proposal.phases.implementation.invalidAmount = true;
						} else {
							ppp.proposal.phases.implementation.invalidAmount = false;
						}
						if (ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost > ppp.opportunity.budget) {
							ppp.exceededOpportunityAmount = true;
						} else {
							ppp.exceededOpportunityAmount = false;
						}
					};

					// set up the structures for capabilities
					// each little bucket continas the capabilities required for that phase
					// as well as the specific skills
					ppp.imp = {};
					ppp.inp = {};
					ppp.prp = {};
					CapabilitiesCommon.init(ppp.imp, ppp.oimp, capabilities, 'implementation');
					CapabilitiesCommon.init(ppp.inp, ppp.oinp, capabilities, 'inception');
					CapabilitiesCommon.init(ppp.prp, ppp.oprp, capabilities, 'prototype');

					// now we need to make an index on the phase teams so we know who is
					// in and who is out of each team, key by email as it is unique
					// and we dont habve to worry about issues comparing _ids
					ppp.iTeam = {};
					ppp.inTeam = {};
					ppp.proposal.phases.inception.team.forEach(member => {
						ppp.inTeam[member.email] = true;
						ppp.iTeam = member;
					});

					ppp.prTeam = {};
					ppp.proposal.phases.proto.team.forEach(member => {
						ppp.prTeam[member.email] = true;
						ppp.iTeam = member;
					});

					ppp.imTeam = {};
					ppp.proposal.phases.implementation.team.forEach(member => {
						ppp.imTeam[member.email] = true;
						ppp.iTeam = member;
					});

					// set up the structure that indicates the aggregate view of member's
					// capabilties ans skills within each phase
					ppp.p_inp.iPropCapabilities = {};
					ppp.p_inp.iPropCapabilitySkills = {};
					ppp.p_prp.iPropCapabilities = {};
					ppp.p_prp.iPropCapabilitySkills = {};
					ppp.p_imp.iPropCapabilities = {};
					ppp.p_imp.iPropCapabilitySkills = {};

					// team question responses
					ppp.responses = [];
					ppp.opportunity.teamQuestions.forEach((teamQuestion, index) => {
						const response: any = {
							question: teamQuestion.question,
							cleanQuestion: $sce.trustAsHtml(teamQuestion.question),
							cleanGuideline: $sce.trustAsHtml(teamQuestion.guideline),
							wordLimit: teamQuestion.wordLimit,
							questionScore: teamQuestion.questionScore,
							showGuidance: true,
							displayInSummary: false
						};

						// if there was a previously saved response, display that
						if (ppp.proposal.teamQuestionResponses && ppp.proposal.teamQuestionResponses[index]) {
							response.response = ppp.proposal.teamQuestionResponses[index].response;
						}

						ppp.responses.push(response);
					});

					ppp.toggleGuidance = index => {
						if (index >= 0 && index < ppp.responses.length) {
							ppp.responses[index].showGuidance = !ppp.responses[index].showGuidance;
						}
					};
					ppp.toggleResponseAccordian = index => {
						if (index >= 0 && index < ppp.responses.length) {
							ppp.responses[index].displayInSummary = !ppp.responses[index].displayInSummary;
						}
					};

					ppp.totals = {};
					ppp.tinymceOptions = TINYMCE_OPTIONS;
					(ppp.tinymceOptions.toolbar = 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent'),
						(ppp.tinymceOptions.plugins = 'wordcount');

					// set up the html display stuff
					ppp.display = {};
					ppp.display.description = $sce.trustAsHtml(ppp.opportunity.description);
					ppp.display.evaluation = $sce.trustAsHtml(ppp.opportunity.evaluation);
					ppp.display.criteria = $sce.trustAsHtml(ppp.opportunity.criteria);

					// ensure status set accordingly
					if (!editing) {
						ppp.proposal.status = 'New';
					}

					// what type of opportunity is this? this will determine what tabs get shown
					ppp.isSprintWithUs = true;
					ppp.proposal.isCompany = true;

					ppp.buildPager();
				};

				// logic for paginating team member pickers for each phase
				ppp.inception = {};
				ppp.poc = {};
				ppp.implementation = {};

				ppp.buildPager = () => {
					ppp.inception.figureOutItemsToDisplay();
					ppp.poc.figureOutItemsToDisplay();
					ppp.implementation.figureOutItemsToDisplay();
				};

				ppp.inception.figureOutItemsToDisplay = () => {
					ppp.inception.filteredItems =
						!ppp.inception.search || ppp.inception.search.length === 0
							? ppp.members.inception
							: ppp.members.inception.filter(member => {
									return member.displayName.toUpperCase().includes(ppp.inception.search.toUpperCase()) || ppp.inTeam[member.email] === true;
							  });
				};

				ppp.inception.pageChanged = () => {
					ppp.inception.figureOutItemsToDisplay();
				};

				ppp.poc.figureOutItemsToDisplay = () => {
					ppp.poc.filteredItems =
						!ppp.poc.search || ppp.poc.search.length === 0
							? ppp.members.proto
							: ppp.members.proto.filter(member => {
									return member.displayName.toUpperCase().includes(ppp.poc.search.toUpperCase()) || ppp.prTeam[member.email] === true;
							  });
				};

				ppp.poc.pageChanged = () => {
					ppp.poc.figureOutItemsToDisplay();
				};

				ppp.implementation.figureOutItemsToDisplay = () => {
					ppp.implementation.filteredItems =
						!ppp.implementation.search || ppp.implementation.search.length === 0
							? ppp.members.implementation
							: ppp.members.implementation.filter(member => {
									return member.displayName.toUpperCase().includes(ppp.implementation.search.toUpperCase()) || ppp.imTeam[member.email] === true;
							  });
				};

				ppp.implementation.pageChanged = () => {
					ppp.implementation.figureOutItemsToDisplay();
				};

				// set the skills and capabilities per phase based on the team selection
				const setSkills = () => {
					// reset all the flags
					ppp.p_inp.iPropCapabilities = {};
					ppp.p_inp.iPropCapabilitySkills = {};
					ppp.p_prp.iPropCapabilities = {};
					ppp.p_prp.iPropCapabilitySkills = {};
					ppp.p_imp.iPropCapabilities = {};
					ppp.p_imp.iPropCapabilitySkills = {};

					// go through each capability and set the flag if any team member
					// has the capability
					// also tally up the booleans in isMetAllCapabilities. if they are all true
					// then the user can submit their proposal
					ppp.isMetAllCapabilities = true;
					let haveanyatall = false;
					if (ppp.oinp.isInception) {
						ppp.inp.oppCapabilityCodes.forEach(c => {
							haveanyatall = true;
							const code = c;
							ppp.p_inp.iPropCapabilities[code] = ppp.members.inception
								.map(member => {
									if (!ppp.inTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilities[code] || false;
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
							ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_inp.iPropCapabilities[code];
						});
					}

					if (ppp.oprp.isPrototype) {
						ppp.prp.oppCapabilityCodes.forEach(c => {
							haveanyatall = true;
							const code = c;
							ppp.p_prp.iPropCapabilities[code] = ppp.members.proto
								.map(member => {
									if (!ppp.prTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilities[code] || false;
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
							ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_prp.iPropCapabilities[code];
						});
					}

					if (ppp.oimp.isImplementation) {
						ppp.imp.oppCapabilityCodes.forEach(c => {
							haveanyatall = true;
							const code = c;
							ppp.p_imp.iPropCapabilities[code] = ppp.members.implementation
								.map(member => {
									if (!ppp.imTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilities[code] || false;
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
							ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_imp.iPropCapabilities[code];
						});
					}
					ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && haveanyatall;
					//
					// now skills
					//
					if (ppp.oinp.isInception) {
						ppp.inp.capabilitySkills.forEach(c => {
							const code = c.code;
							ppp.p_inp.iPropCapabilitySkills[code] = ppp.members.inception
								.map(member => {
									if (!ppp.inTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilitySkills[code];
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
						});
					}
					if (ppp.oprp.isPrototype) {
						ppp.prp.capabilitySkills.forEach(c => {
							const code = c.code;
							ppp.p_prp.iPropCapabilitySkills[code] = ppp.members.proto
								.map(member => {
									if (!ppp.prTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilitySkills[code];
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
						});
					}
					if (ppp.oimp.isImplementation) {
						ppp.imp.capabilitySkills.forEach(c => {
							const code = c.code;
							ppp.p_imp.iPropCapabilitySkills[code] = ppp.members.implementation
								.map(member => {
									if (!ppp.imTeam[member.email]) {
										return false;
									} else {
										return member.iCapabilitySkills[code];
									}
								})
								.reduce((accum, el) => {
									return accum || el;
								}, false);
						});
					}
				};

				// set the team arrays from the boolean lists
				const setTeams = () => {
					ppp.p_inp.team = [];
					ppp.members.inception.forEach(member => {
						if (ppp.inTeam[member.email]) {
							ppp.p_inp.team.push(member);
						}
					});

					ppp.p_prp.team = [];
					ppp.members.proto.forEach(member => {
						if (ppp.prTeam[member.email]) {
							ppp.p_prp.team.push(member);
						}
					});

					ppp.p_imp.team = [];
					ppp.members.implementation.forEach(member => {
						if (ppp.imTeam[member.email]) {
							ppp.p_imp.team.push(member);
						}
					});
				};

				// when a member name is selecetd or deselected set the flag indicating such
				// and add or remove the member's capabilities and skills from the overall
				// phase list of capbilities and skills
				ppp.clickMember = (member, boolIndex) => {
					boolIndex[member.email] = !boolIndex[member.email];
					setSkills();
				};

				// save the proposal
				const saveproposal = (goodmessage?, badmessage?) => {
					const validPriceAmounts =
						!ppp.exceededOpportunityAmount && !ppp.proposal.phases.inception.invalidAmount && !ppp.proposal.phases.proto.invalidAmount && !ppp.proposal.phases.implementation.invalidAmount;

					// validate price amounts - shouldn't be able to save invalid amounts
					if (!validPriceAmounts) {
						Notification.error({
							message: 'Invalid price amounts entered',
							title: '<i class="fas fa-exclamation-triangle"</i> Error submitting proposal'
						});
						ppp.activateTab(4);
						window.scrollTo(0, 0);
						return;
					}

					ppp.proposal.opportunity = ppp.opportunity;
					ppp.proposal.businessName = ppp.org.name;
					ppp.proposal.businessAddress = ppp.org.fullAddress;
					ppp.proposal.businessContactName = ppp.org.contactName;
					ppp.proposal.businessContactEmail = ppp.org.contactEmail;
					ppp.proposal.businessContactPhone = ppp.org.contactPhone;
					ppp.proposal.teamQuestionResponses = ppp.responses;
					setTeams();

					return new Promise((resolve, reject) => {
						ppp.proposal.createOrUpdate().then(
							response => {
								Notification.success({
									message: goodmessage || '<i class="fas fa-3x fa-check-circle"></i><br> <h4>Changes saved</h4>'
								});
								resolve();
							},
							error => {
								Notification.error({
									message: badmessage || error.data.message,
									title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Error - your changes were not saved'
								});
								reject();
							}
						);
					});
				};

				// perform the save, both user info and proposal info
				ppp.save = isvalid => {
					if (!isvalid) {
						$scope.$broadcast('show-errors-check-validity', 'ppp.form.proposalform');
						return false;
					}
					ppp.proposal.isAcceptedTerms = ppp.checkBoxModel.value;
					saveproposal()
					.then(() => {
						// if this is a newly created proposal, transition to edit view
						if (!editing) {
							$state.go('proposaladmin.editswu', { proposalId: ppp.proposal._id, opportunityId: ppp.opportunity.code });
						}
					})
				};

				// leave without saving any work
				ppp.close = () => {
					$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
				};

				// this is structured to be part of a promise chain, the input to the final
				// function is a boolean as to whether or not to perform the action
				const performdelete = q => {
					ask.yesNo(q).then(r => {
						if (r) {
							ppp.proposal.$remove(
								() => {
									Notification.success({
										message: '<i class="fas fa-3x fa-check-circle"></i> Proposal deleted'
									});
									$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
								},
								error => {
									Notification.error({
										message: error.data.message,
										title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Error - could not delete your proposal'
									});
								}
							);
						}
					});
				};

				const performwithdrawal = (txt?) => {
					ppp.agreeConfirm = false;
					ppp.proposal.status = 'Draft';
					saveproposal('<h4>Your proposal has been withdrawn</h4>');
				};

				// this deletes a draft
				ppp.delete = () => {
					performdelete('Are you sure you want to delete your proposal? All your work will be lost. There is no undo for this!');
				};

				// this deletes a submission
				ppp.withdraw = () => {
					performwithdrawal();
				};

				// submit the proposal
				ppp.submit = () => {
					// validate price amounts - shouldn't be able to sumbit prices that exceed max
					const validPriceAmounts =
						!ppp.exceededOpportunityAmount && !ppp.proposal.phases.inception.invalidAmount && !ppp.proposal.phases.proto.invalidAmount && !ppp.proposal.phases.implementation.invalidAmount;
					if (!validPriceAmounts) {
						Notification.error({
							message: 'Invalid price amounts entered',
							title: '<i class="fas fa-exclamation-triangle"</i> Error submitting proposal'
						});
						ppp.activateTab(4);
						window.scrollTo(0, 0);
						return;
					}

					// validate word counts - shouldn't be able to submit responses to questions that exceed max word count
					let invalidResponseIndex = 0;
					$window.tinymce.editors.forEach((editor, index) => {
						if (editor.plugins.wordcount.getCount() > ppp.opportunity.teamQuestions[index].wordLimit) {
							Notification.error({
								message: 'Word count exceeded for Question ' + (index + 1) + '.  Please edit your response before submitting',
								title: '<i class="fas fa-exclamation-triangle"</i> Error'
							});
							invalidResponseIndex = index + 1;
						}
					});

					if (invalidResponseIndex > 0) {
						ppp.activateTab(5);
						window.scrollTo(0, 0);
						return;
					}

					// ensure that proposal has met all the criteria for submission
					if (!(ppp.proposal.isAcceptedTerms && ppp.isMetAllCapabilities && ppp.orgHasMetRFQ)) {
						Notification.error({
							message: 'Please ensure you have met the RFQ.  The Terms & Conditions must be accepted and your selected team members must meet all capabilities',
							title: '<i class="fas fa-exclamation-triangle"</i> Error'
						});
						return;
					}

					ppp.proposal.opportunity = ppp.opportunity;
					ppp.proposal.businessName = ppp.org.name;
					ppp.proposal.businessAddress = ppp.org.fullAddress;
					ppp.proposal.businessContactName = ppp.org.contactName;
					ppp.proposal.businessContactEmail = ppp.org.contactEmail;
					ppp.proposal.businessContactPhone = ppp.org.contactPhone;
					ppp.proposal.teamQuestionResponses = ppp.responses;
					setTeams();
					ppp.proposal.status = 'Submitted';
					saveproposal('<h4>Your proposal has been submitted</h4>').then(() => {
						ppp.close();
					});
				};

				// upload documents
				ppp.upload = file => {
					if (!file) {
						return;
					}
					if (file.size > 3 * 1024 * 1024) {
						Notification.error({
							delay: 6000,
							title: '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x"></i> File Too Large</div>',
							message: '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
						});
					} else {
						Upload.upload({
							method: 'POST',
							url: '/api/proposals/' + ppp.proposal._id + '/documents',
							data: {
								file
							}
						}).then(
							response => {
								ppp.proposal = new ProposalsService(response.data);
								Notification.success({
									message: '<i class="fas fa-3x fa-check-circle"></i> Attachment Uploaded'
								});
							},
							response => {
								Notification.error({
									message: response.data,
									title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Error Uploading Attachment'
								});
							},
							evt => {
								ppp.progress = (100.0 * evt.loaded) / evt.total;
							}
						);
					}
				};
				ppp.deletefile = fileid => {
					ProposalsService.removeDoc({
						proposalId: ppp.proposal._id,
						documentId: fileid
					}).$promise.then(doc => {
						ppp.proposal = doc;
					});
				};
				ppp.termsDownloaded = false;
				ppp.downloadTermsClicked = () => {
					ppp.termsDownloaded = true;
				};

				// Get a font-awesome icon name for the given file type
				ppp.getIconName = type => {
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
				};

				// initialize the controller and then initialize the proposal capabilities
				// and skills as aggreagate of the teams's
				init();
				setSkills();
			}
		]);
})();
