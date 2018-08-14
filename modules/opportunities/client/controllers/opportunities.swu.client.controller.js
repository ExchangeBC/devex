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
		if (!vm.opportunity.teamQuestions) {
			vm.opportunity.teamQuestions = [];
		}
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
			vm.currentGuidelineText = '';
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
		if (!vm.opportunity.addenda) {
			vm.opportunity.addenda = [];
		}
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
