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
	angular.module('proposals')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller ('ProposalsListController', function (ProposalsService) {
		var ppp           = this;
		ppp.proposals = ProposalsService.query ();
	})
	// =========================================================================
	//
	// Controller the view of the proposal page
	//
	// =========================================================================
	.controller ('ProposalViewSWUController', function ($scope, capabilities, $sce, $state, proposal, Authentication, ProposalsService, Notification, ask, dataService) {
		var ppp           = this;
		ppp.features = window.features;
		ppp.proposal      = proposal;
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
		ppp.capabilities                          = capabilities;
		//
		// what type of opportunity is this? this will determine what tabs get shown
		//
		ppp.isSprintWithUs = true;
			ppp.p_imp          = ppp.proposal.phases.implementation;
			ppp.p_inp          = ppp.proposal.phases.inception;
			ppp.p_prp          = ppp.proposal.phases.proto;
			ppp.p_agg          = ppp.proposal.phases.aggregate;
			ppp.oimp           = ppp.opportunity.phases.implementation;
			ppp.oinp           = ppp.opportunity.phases.inception;
			ppp.oprp           = ppp.opportunity.phases.proto;
			ppp.oagg           = ppp.opportunity.phases.aggregate;
			ppp.oimp.f_endDate   = formatDate (new Date (ppp.oimp.endDate  ));
			ppp.oimp.f_startDate = formatDate (new Date (ppp.oimp.startDate));
			ppp.oinp.f_endDate   = formatDate (new Date (ppp.oinp.endDate  ));
			ppp.oinp.f_startDate = formatDate (new Date (ppp.oinp.startDate));
			ppp.oprp.f_endDate   = formatDate (new Date (ppp.oprp.endDate  ));
			ppp.oprp.f_startDate = formatDate (new Date (ppp.oprp.startDate));
		// -------------------------------------------------------------------------
		//
		// close the window
		//
		// -------------------------------------------------------------------------
		ppp.close = function () {
			if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
				$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
			} else {
				$state.go ('opportunities.viewcwu',{opportunityId:ppp.opportunity.code});
			}
		};
		ppp.type = function (type) {
			if (type.indexOf ('pdf') > -1) return 'pdf';
			else if (type.indexOf ('image') > -1) return 'image';
			else if (type.indexOf ('word') > -1) return 'word';
			else if (type.indexOf ('excel') > -1) return 'excel';
			else if (type.indexOf ('powerpoint') > -1) return 'powerpoint';
		};
		ppp.downloadfile = function (fileid) {
			ProposalsService.downloadDoc ({
				proposalId: ppp.proposal._id,
				documentId: fileid
			});
		};
		ppp.assign = function () {
			var q = 'Are you sure you want to assign this opportunity to this proponent?';
			ask.yesNo (q).then (function (r) {
				if (r) {
					ProposalsService.assign (ppp.proposal).$promise
					.then (
						function (response) {
							ppp.proposal = response;
							Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i> Company Assigned'});
							if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
								$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
							} else {
								$state.go ('opportunities.viewcwu',{opportunityId:ppp.opportunity.code});
							}
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="fa fa-3x fa-exclamation-triangle"></i> Error - Assignment failed!' });
						}
					);
				}
			});
		};
	})
	// =========================================================================
	//
	// Controller the view of the proposal page
	//
	// =========================================================================
	.controller ('ProposalEditSWUController', function (capabilities, editing, $scope, $sce, ask, Upload, $state, proposal, opportunity, Authentication, ProposalsService, Notification, NotificationsService, dataService, CapabilitiesMethods, org, TINYMCE_OPTIONS, resources) {
		var ppp                                   = this;
		var _init = function () {
			ppp.features = window.features;
			ppp.trust    = $sce.trustAsHtml;
			//
			// check we have an opp
			//
			if (!opportunity) {
				console.error ('no opportunity was provided!');
			}
			ppp.opportunity  = opportunity;
			ppp.org          = org;
			ppp.members      = resources;
			ppp.title        = editing ? 'Edit' : 'Create' ;
			ppp.proposal     = proposal;
			ppp.user         = Authentication.user;
			if (org) ppp.org.fullAddress = ppp.org.address + (ppp.org.address2?', '+ppp.org.address2:'') + ', ' + ppp.org.city + ', ' + ppp.org.province+ ', ' + ppp.org.postalcode ;
			ppp.proposal.org = org;
			ppp.orgHasMetRFQ = org.metRFQ;
			ppp.agreeConfirm = false;
			//
			// this is all the people in the org
			//
			if (!ppp.proposal.phases) {
				ppp.proposal.phases = {
					implementation : {
						isImplementation : false,
						team             : [],
						cost             : 0
					},
					inception : {
						isInception : false,
						team        : [],
						cost        : 0
					},
					proto : {
						isPrototype : false,
						team        : [],
						cost        : 0
					},
					aggregate : {
						team : [],
						cost : 0
					}
				}
			}
			//
			// lazy lazy lazy
			// set up pointers to the proposal phases just so we dont have to type so much
			// and also to the opportunity phases for the same reason
			//
			ppp.p_imp          = ppp.proposal.phases.implementation;
			ppp.p_inp          = ppp.proposal.phases.inception;
			ppp.p_prp          = ppp.proposal.phases.proto;
			ppp.p_agg          = ppp.proposal.phases.aggregate;
			ppp.oimp           = ppp.opportunity.phases.implementation;
			ppp.oinp           = ppp.opportunity.phases.inception;
			ppp.oprp           = ppp.opportunity.phases.proto;
			ppp.oagg           = ppp.opportunity.phases.aggregate;
			ppp.oimp.f_endDate   = formatDate (new Date (ppp.oimp.endDate  ));
			ppp.oimp.f_startDate = formatDate (new Date (ppp.oimp.startDate));
			ppp.oinp.f_endDate   = formatDate (new Date (ppp.oinp.endDate  ));
			ppp.oinp.f_startDate = formatDate (new Date (ppp.oinp.startDate));
			ppp.oprp.f_endDate   = formatDate (new Date (ppp.oprp.endDate  ));
			ppp.oprp.f_startDate = formatDate (new Date (ppp.oprp.startDate));
			//
			// set up validators for currency amount validators for each phase
			//
			ppp.exceededOpportunityAmount = false;
			ppp.proposal.phases.inception.invalidAmount = false;
			ppp.proposal.phases.proto.invalidAmount = false;
			ppp.proposal.phases.implementation.invalidAmount = false;
			ppp.validateInceptionAmount = function() {
				ppp.inceptionMax = 100000;
				if (ppp.proposal.phases.inception.cost < 0 || ppp.proposal.phases.inception.cost > ppp.inceptionMax) {
					ppp.proposal.phases.inception.invalidAmount = true;
				}
				else {
					ppp.proposal.phases.inception.invalidAmount = false;
				}
				if ((ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost) > ppp.opportunity.budget) {
					ppp.exceededOpportunityAmount = true;
				}
				else {
					ppp.exceededOpportunityAmount = false;
				}
			}
			ppp.validatePrototypeAmount = function() {
				ppp.protoMax = 500000;
				if (ppp.proposal.phases.proto.cost < 0 || ppp.proposal.phases.proto.cost > ppp.protoMax) {
					ppp.proposal.phases.proto.invalidAmount = true;
				}
				else {
					ppp.proposal.phases.proto.invalidAmount = false;
				}
				if ((ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost) > ppp.opportunity.budget) {
					ppp.exceededOpportunityAmount = true;
				}
				else {
					ppp.exceededOpportunityAmount = false;
				}
			}
			ppp.validateImplementationAmount = function() {
				ppp.implMax = 2000000;
				if (ppp.proposal.phases.implementation.cost < 0 || ppp.proposal.phases.implementation.cost > ppp.implMax) {
					ppp.proposal.phases.implementation.invalidAmount = true;
				}
				else {
					ppp.proposal.phases.implementation.invalidAmount = false;
				}
				if ((ppp.proposal.phases.inception.cost + ppp.proposal.phases.proto.cost + ppp.proposal.phases.implementation.cost) > ppp.opportunity.budget) {
					ppp.exceededOpportunityAmount = true;
				}
				else {
					ppp.exceededOpportunityAmount = false;
				}
			}
			//
			// set up the structures for capabilities
			// each little bucket continas the capabilities required for that phase
			// as well as the specific skills
			//
			ppp.imp = {};
			ppp.inp = {};
			ppp.prp = {};
			CapabilitiesMethods.init (ppp.imp, ppp.oimp, capabilities, 'implementation');
			CapabilitiesMethods.init (ppp.inp, ppp.oinp, capabilities, 'inception');
			CapabilitiesMethods.init (ppp.prp, ppp.oprp, capabilities, 'prototype');
			//
			// now we need to make an index on the phase teams so we know who is
			// in and who is out of each team, key by email as it is unique
			// and we dont habve to worry about issues comparing _ids
			//
			ppp.iTeam = {};
			ppp.inTeam = {}
			ppp.proposal.phases.inception.team.forEach (function (member) {
				ppp.inTeam[member.email] = true;
				ppp.iTeam = member;
			});
			ppp.prTeam = {}
			ppp.proposal.phases.proto.team.forEach (function (member) {
				ppp.prTeam[member.email] = true;
				ppp.iTeam = member;
			});
			ppp.imTeam = {}
			ppp.proposal.phases.implementation.team.forEach (function (member) {
				ppp.imTeam[member.email] = true;
				ppp.iTeam = member;
			});
			//
			// set up the structure that indicates the aggregate view of member's
			// capabilties ans skills within each phase
			//
			ppp.p_inp.iPropCapabilities = {};
			ppp.p_inp.iPropCapabilitySkills = {};
			ppp.p_prp.iPropCapabilities = {};
			ppp.p_prp.iPropCapabilitySkills = {};
			ppp.p_imp.iPropCapabilities = {};
			ppp.p_imp.iPropCapabilitySkills = {};
			//
			// questions: HACK, needs to be better and indexed etc etc
			//
			ppp.questions = dataService.questions;
			var i;
			if (!ppp.proposal.questions) ppp.proposal.questions = [];
			for (i=0; i<ppp.questions.length; i++) {
				if (!ppp.proposal.questions[i]) {
					ppp.proposal.questions[i] = {question:ppp.questions[i],response:''};
				}
			}

			ppp.totals = {};
			ppp.tinymceOptions = TINYMCE_OPTIONS;
			//
			// set up the html display stuff
			//
			ppp.display = {};
			ppp.display.description    = $sce.trustAsHtml(ppp.opportunity.description);
			ppp.display.evaluation     = $sce.trustAsHtml(ppp.opportunity.evaluation);
			ppp.display.criteria       = $sce.trustAsHtml(ppp.opportunity.criteria);
			//
			// ensure status set accordingly
			//
			if (!editing) {
				ppp.proposal.status = 'New';
			}
			//
			// what type of opportunity is this? this will determine what tabs get shown
			//
			ppp.isSprintWithUs = true;
			ppp.proposal.isCompany = true;

			ppp.buildPager();
		}
		// -------------------------------------------------------------------------
		//
		// logic for paginating team member pickers for each phase
		//
		// -------------------------------------------------------------------------
		ppp.inception = {};
		ppp.poc = {};
		ppp.implementation = {};
		ppp.buildPager = function () {
			ppp.inception.pagedItems = [];
			ppp.inception.itemsPerPage = 5;
			ppp.inception.currentPage = 1;
			ppp.inception.figureOutItemsToDisplay();
			ppp.poc.pagedItems = [];
			ppp.poc.itemsPerPage = 5;
			ppp.poc.currentPage = 1;
			ppp.poc.figureOutItemsToDisplay();
			ppp.implementation.pagedItems = [];
			ppp.implementation.itemsPerPage = 5;
			ppp.implementation.currentPage = 1;
			ppp.implementation.figureOutItemsToDisplay();
		}
		ppp.inception.figureOutItemsToDisplay = function () {

			ppp.inception.filteredItems = (!ppp.inception.search || ppp.inception.search.length === 0) ?
				ppp.members.inception :
				ppp.members.inception.filter(function (member) {
					return 	(member.displayName.toUpperCase().includes(ppp.inception.search.toUpperCase()) ||
							(ppp.inTeam[member.email] === true));
				});
			var begin = ((ppp.inception.currentPage - 1) * ppp.inception.itemsPerPage);
			var end = begin + ppp.inception.itemsPerPage;
			var items = ppp.inception.filteredItems.slice(begin, end);
			ppp.inception.filterLength = ppp.inception.filteredItems.length;
			ppp.inception.pagedItems = items;
		}
		ppp.inception.pageChanged = function () {
			ppp.inception.figureOutItemsToDisplay();
		}
		ppp.poc.figureOutItemsToDisplay = function () {

			ppp.poc.filteredItems = (!ppp.poc.search || ppp.poc.search.length === 0) ?
				ppp.members.proto :
				ppp.members.proto.filter(function (member) {
					return 	(member.displayName.toUpperCase().includes(ppp.poc.search.toUpperCase()) ||
							(ppp.prTeam[member.email] === true));
				});
			var begin = ((ppp.poc.currentPage - 1) * ppp.poc.itemsPerPage);
			var end = begin + ppp.poc.itemsPerPage;
			var items = ppp.poc.filteredItems.slice(begin, end);
			ppp.poc.filterLength = ppp.poc.filteredItems.length;
			ppp.poc.pagedItems = items;
		}
		ppp.poc.pageChanged = function () {
			ppp.poc.figureOutItemsToDisplay();
		}
		ppp.implementation.figureOutItemsToDisplay = function () {

			ppp.implementation.filteredItems = (!ppp.implementation.search || ppp.implementation.search.length === 0) ?
				ppp.members.implementation :
				ppp.members.implementation.filter(function (member) {
					return 	(member.displayName.toUpperCase().includes(ppp.implementation.search.toUpperCase()) ||
							(ppp.imTeam[member.email] === true));
				});
			var begin = ((ppp.implementation.currentPage - 1) * ppp.implementation.itemsPerPage);
			var end = begin + ppp.implementation.itemsPerPage;
			var items = ppp.implementation.filteredItems.slice(begin, end);
			ppp.implementation.filterLength = ppp.implementation.filteredItems.length;
			ppp.implementation.pagedItems = items;
		}
		ppp.implementation.pageChanged = function () {
			ppp.implementation.figureOutItemsToDisplay();
		}
		// -------------------------------------------------------------------------
		//
		// set the skills and capabilities per phase based on the team selection
		//
		// -------------------------------------------------------------------------
		var setSkills = function () {
			//
			// reset all the flags
			//
			ppp.p_inp.iPropCapabilities = {};
			ppp.p_inp.iPropCapabilitySkills = {};
			ppp.p_prp.iPropCapabilities = {};
			ppp.p_prp.iPropCapabilitySkills = {};
			ppp.p_imp.iPropCapabilities = {};
			ppp.p_imp.iPropCapabilitySkills = {};
			//
			// go through each capability and set the flag if any team member
			// has the capability
			// also tally up the booleans in isMetAllCapabilities. if they are all true
			// then the user can submit their proposal
			//
			// console.log (ppp.prp);
			ppp.isMetAllCapabilities = true;
			var haveanyatall = false;
			// console.log ('ppp.oinp.isInception', ppp.oinp.isInception);
			if (ppp.oinp.isInception) ppp.inp.oppCapabilityCodes.forEach (function (c) {
				haveanyatall = true;
				var code = c;
				// console.log ('code', code);
				ppp.p_inp.iPropCapabilities[code] = ppp.members.inception.map (function (member) {
					if (!ppp.inTeam[member.email]) return false;
					else return member.iCapabilities[code] || false;
				}).reduce (function (accum, el) {return accum || el}, false);
				ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_inp.iPropCapabilities[code];
				// console.log ('ppp.p_inp.iPropCapabilities[code]', ppp.p_inp.iPropCapabilities[code]);
			});
			// console.log ('ppp.oprp.isPrototype', ppp.oprp.isPrototype);
			if (ppp.oprp.isPrototype) ppp.prp.oppCapabilityCodes.forEach (function (c) {
				haveanyatall = true;
				var code = c;
				// console.log ('code', code);
				ppp.p_prp.iPropCapabilities[code] = ppp.members.proto.map (function (member) {
					// console.log ('member', member);
					if (!ppp.prTeam[member.email]) return false;
					else return member.iCapabilities[code] || false;
				}).reduce (function (accum, el) {return accum || el}, false);
				ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_prp.iPropCapabilities[code];
				// console.log ('ppp.p_prp.iPropCapabilities[code]', ppp.p_prp.iPropCapabilities[code]);
			});
			// console.log ('ppp.oimp.isImplementation', ppp.oimp.isImplementation);
			if (ppp.oimp.isImplementation) ppp.imp.oppCapabilityCodes.forEach (function (c) {
				haveanyatall = true;
				var code = c;
				// console.log ('code', code);
				ppp.p_imp.iPropCapabilities[code] = ppp.members.implementation.map (function (member) {
					if (!ppp.imTeam[member.email]) return false;
					else return member.iCapabilities[code] || false;
				}).reduce (function (accum, el) {return accum || el}, false);
				ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && ppp.p_imp.iPropCapabilities[code];
				// console.log ('ppp.p_imp.iPropCapabilities[code]', ppp.p_imp.iPropCapabilities[code]);
			});
			// console.log ('haveanyatall', haveanyatall);
			// console.log ('isMetAllCapabilities', ppp.isMetAllCapabilities);
			ppp.isMetAllCapabilities = ppp.isMetAllCapabilities && haveanyatall;
			//
			// now skills
			//
			if (ppp.oinp.isInception) ppp.inp.capabilitySkills.forEach (function (c) {
				var code = c.code;
				ppp.p_inp.iPropCapabilitySkills[code] = ppp.members.inception.map (function (member) {
					if (!ppp.inTeam[member.email]) return false;
					else return member.iCapabilitySkills[code];
				}).reduce (function (accum, el) {return accum || el}, false);
			});
			if (ppp.oprp.isPrototype) ppp.prp.capabilitySkills.forEach (function (c) {
				var code = c.code;
				ppp.p_prp.iPropCapabilitySkills[code] = ppp.members.proto.map (function (member) {
					if (!ppp.prTeam[member.email]) return false;
					else return member.iCapabilitySkills[code];
				}).reduce (function (accum, el) {return accum || el}, false);
			});
			if (ppp.oimp.isImplementation) ppp.imp.capabilitySkills.forEach (function (c) {
				var code = c.code;
				ppp.p_imp.iPropCapabilitySkills[code] = ppp.members.implementation.map (function (member) {
					if (!ppp.imTeam[member.email]) return false;
					else return member.iCapabilitySkills[code];
				}).reduce (function (accum, el) {return accum || el}, false);
			});
		};
		// -------------------------------------------------------------------------
		//
		// set the team arrays from the boolean lists
		//
		// -------------------------------------------------------------------------
		var setTeams = function () {
			ppp.p_inp.team = [];
			ppp.members.inception.forEach (function (member) {
				if (ppp.inTeam[member.email]) ppp.p_inp.team.push (member);
			});
			ppp.p_prp.team = [];
			ppp.members.proto.forEach (function (member) {
				if (ppp.prTeam[member.email]) ppp.p_prp.team.push (member);
			});
			ppp.p_imp.team = [];
			ppp.members.implementation.forEach (function (member) {
				if (ppp.imTeam[member.email]) ppp.p_imp.team.push (member);
			});
		};
		// -------------------------------------------------------------------------
		//
		// when a member name is selecetd or deselected set the flag indicating such
		// and add or remove the member's capabilities and skills from the overall
		// phase list of capbilities and skills
		//
		// -------------------------------------------------------------------------
		ppp.clickMember = function (member, boolIndex) {
			boolIndex[member.email] = !boolIndex[member.email];
			setSkills ();
		};
		// -------------------------------------------------------------------------
		//
		// save the proposal - promise
		//
		// -------------------------------------------------------------------------
		var saveproposal = function (goodmessage, badmessage) {
			var validPriceAmounts = !ppp.exceededOpportunityAmount && !ppp.proposal.phases.inception.invalidAmount && !ppp.proposal.phases.proto.invalidAmount && !ppp.proposal.phases.implementation.invalidAmount;
			console.log(validPriceAmounts);
			if (!validPriceAmounts) {
				Notification.error({
					message: 'Invalid price amounts entered',
					title: '<i class="glyphicon glyphicon-remove"</i> Error submitting proposal'
				});
				return;
			}
			ppp.proposal.opportunity          = ppp.opportunity;
			ppp.proposal.businessName         = ppp.org.name;
			ppp.proposal.businessAddress      = ppp.org.fullAddress;
			ppp.proposal.businessContactName  = ppp.org.contactName;
			ppp.proposal.businessContactEmail = ppp.org.contactEmail;
			ppp.proposal.businessContactPhone = ppp.org.contactPhone;
			setTeams ();
			return new Promise (function (resolve, reject) {
				ppp.proposal.createOrUpdate ()
				.then (
					function (response) {
						Notification.success({ message: goodmessage || '<i class="fa fa-3x fa-check-circle"></i><br> <h4>Changes saved</h4>'});
						ppp.subscribe (true);
						resolve ();
					},
					function (error) {
						 Notification.error ({ message: badmessage || error.data.message, title: '<i class="fa fa-3x fa-exclamation-triangle"></i> Error - your changes were not saved' });
						 reject ();
					}
				);
			});
		};
		// -------------------------------------------------------------------------
		//
		// perform the save, both user info and proposal info
		//
		// -------------------------------------------------------------------------
		ppp.save = function (isvalid) {
			if (!isvalid) {
				$scope.$broadcast('show-errors-check-validity', 'ppp.form.proposalform');
				return false;
			}
			saveproposal ();
		};
		// -------------------------------------------------------------------------
		//
		// leave without saving any work
		//
		// -------------------------------------------------------------------------
		ppp.close = function () {
			$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
		};
		// -------------------------------------------------------------------------
		//
		// this is structured to be part of a promise chain, the input to the final
		// function is a boolean as to whether or not to perform the action
		//
		// -------------------------------------------------------------------------
		var performdelete = function (q) {
			ask.yesNo (q).then (function (r) {
				if (r) {
					ppp.proposal.$remove (
						function () {
							Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i> Proposal deleted'});
							ppp.subscribe (false);
							$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="fa fa-3x fa-exclamation-triangle"></i> Error - could not delete your proposal'});
						}
					);
				}
			});
		};
		var performwithdrawal = function (txt) {
			ppp.agreeConfirm = false;
			ppp.proposal.status = 'Draft';
			saveproposal ('<h4>Your proposal has been withdrawn</h4>');
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a draft
		//
		// -------------------------------------------------------------------------
		ppp.delete = function () {
			performdelete ('Are you sure you want to delete your proposal? All your work will be lost. There is no undo for this!');
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a submission
		//
		// -------------------------------------------------------------------------
		ppp.withdraw = function () {
			performwithdrawal ();
		};
		// -------------------------------------------------------------------------
		//
		// submit the proposal
		//
		// -------------------------------------------------------------------------
		ppp.submit = function () {
			var validPriceAmounts = !ppp.exceededOpportunityAmount && !ppp.proposal.phases.inception.invalidAmount && !ppp.proposal.phases.proto.invalidAmount && !ppp.proposal.phases.implementation.invalidAmount;
			// console.log(validPriceAmounts);
			if (!validPriceAmounts) {
				Notification.error({
					message: 'Invalid price amounts entered',
					title: '<i class="glyphicon glyphicon-remove"</i> Error submitting proposal'
				});
				return;
			}
			ppp.proposal.opportunity          = ppp.opportunity;
			ppp.proposal.businessName         = ppp.org.name;
			ppp.proposal.businessAddress      = ppp.org.fullAddress;
			ppp.proposal.businessContactName  = ppp.org.contactName;
			ppp.proposal.businessContactEmail = ppp.org.contactEmail;
			ppp.proposal.businessContactPhone = ppp.org.contactPhone;
			setTeams ();
			ppp.proposal.status = 'Submitted';
			saveproposal ('<h4>Your proposal has been submitted</h4>');
			// ProposalsService.submit (ppp.proposal).$promise
			// .then (
			// 	function (response) {
			// 		console.log ('response', response);
			// 		ppp.proposal = response;
			// 		Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i><br> <h4>Your proposal has been submitted</h4>'});
			// 		_init ();
			// 		setSkills ();
			// 	},
			// 	function (error) {
			// 		 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Error Submitting Proposal' });
			// 	}
			// );
		}
		// -------------------------------------------------------------------------
		//
		// upload documents
		//
		// -------------------------------------------------------------------------
		ppp.upload = function (file) {
			Upload.upload({
				url: '/api/proposal/'+ppp.proposal._id+'/upload/doc',
				data: {
					file: file
				}
			})
			.then(
				function (response) {
					ppp.proposal = new ProposalsService (response.data);
					Notification.success({ message: '<i class="fa fa-3x fa-check-circle"></i> Attachment Uploaded'});
				},
				function (response) {
					Notification.error ({ message: response.data, title: '<i class="fa fa-3x fa-exclamation-triangle"></i> Error Uploading Attachment' });
				},
				function (evt) {
					ppp.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
			});

		};
		ppp.deletefile = function (fileid) {
			ProposalsService.removeDoc ({
				proposalId: ppp.proposal._id,
				documentId: fileid
			}).$promise
			.then (function (doc) {
				ppp.proposal = doc;
				// $scope.$apply();
			});
		};
		ppp.termsDownloaded = false;
		ppp.downloadTermsClicked = function() {
			ppp.termsDownloaded = true;
		}
		ppp.subscribe = function (state) {
			var notificationCode = 'not-update-'+ppp.opportunity.code;
			if (!editing && !ppp.proposal._id && state) {
				NotificationsService.subscribeNotification ({notificationId: notificationCode}).$promise
				.then (function () {
					ppp.notifyMe = true;
				}).catch (function () {
				});
			}
			else {
				NotificationsService.unsubscribeNotification ({notificationId: notificationCode}).$promise
				.then (function () {
					ppp.notifyMe = false;
				}).catch (function () {
				});
			}
		};
		ppp.type = function (type) {
			if (type.indexOf ('pdf') > -1) return 'pdf';
			else if (type.indexOf ('image') > -1) return 'image';
			else if (type.indexOf ('word') > -1) return 'word';
			else if (type.indexOf ('excel') > -1) return 'excel';
			else if (type.indexOf ('powerpoint') > -1) return 'powerpoint';
		};
		// -------------------------------------------------------------------------
		//
		// initialize the controller and then initialize the proposal capabilities
		// and skills as aggreagate of the teams's
		//
		// -------------------------------------------------------------------------
		_init ();
		setSkills ();
	})
	;
}());
