(function () {
	'use strict';

	angular.module('opportunities')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('OpportunitiesListController', function (OpportunitiesService, Authentication) {
		var vm      = this;
		vm.opportunities = OpportunitiesService.query();
		var isUser = Authentication.user;
		vm.isUser = isUser;
	})
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('OpportunityLandingController', function (Authentication, $stateParams) {
		var vm          = this;
		vm.programId    = $stateParams.programId;
		vm.programTitle = $stateParams.programTitle;
		vm.projectId    = $stateParams.projectId;
		vm.projectTitle = $stateParams.projectTitle;
		vm.context      = $stateParams.context;
		var isUser      = Authentication.user;
		var isAdmin     = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov       = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.userCanAdd   = (isAdmin || isGov);
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewController', function ($state, $stateParams, $sce, opportunity, Authentication, OpportunitiesService, ProposalsService, Notification, modalService, ask, myproposal, OpportunitiesCommon) {
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
		vm.authentication         = Authentication;
		vm.OpportunitiesService   = OpportunitiesService;
		vm.idString               = 'opportunityId';
		vm.display                = {};
		vm.display.description    = $sce.trustAsHtml(vm.opportunity.description);
		vm.display.evaluation     = $sce.trustAsHtml(vm.opportunity.evaluation);
		vm.display.criteria       = $sce.trustAsHtml(vm.opportunity.criteria);
		vm.trust 				  = $sce.trustAsHtml;
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
			new        : 0,
			questions  : 1,
			interview  : 2,
			price      : 3,
			assigned   : 4
		};
		//
		// this returns true if the current stage is on or past the indicated stage
		//
		vm.stage = function (stage) {
			return vm.opportunity.evaluationStage >= vm.stages[stage];
		};
		vm.stageIs = function (stage) {
			return vm.opportunity.evaluationStage === vm.stages[stage];
		};
		// -------------------------------------------------------------------------
		//
		// stuff for swu evaluation
		//
		// -------------------------------------------------------------------------
		if (vm.opportunity.opportunityTypeCd === 'sprint-with-us') {
			ProposalsService.forOpportunity ({opportunityId:vm.opportunity._id}).$promise
			.then (function (proposals) {
				vm.proposals = proposals;
				//
				// removed hack as this is now in the right place in the edit opportunity
				//

				// //
				// // HACK: TBD : should have questions already on opportunity
				// //
				// vm.opportunity.questions = [];
				// vm.proposals[0].questions.forEach (function (q) {
				// 	vm.opportunity.questions.push (q.question);
				// });
				// //
				// // end of hack
				// //
				//
				// make an array of responses (question objects) by question
				//
				vm.responses = [];
				var questionIndex;
				for (questionIndex=0; questionIndex<vm.opportunity.questions.length; questionIndex++) {
					vm.responses[questionIndex] = [];
					vm.proposals.forEach (function (p) {
						vm.responses[questionIndex].push (p.questions[questionIndex])
					});
				}
				vm.responses.forEach (function (q) {
					q.forEach (function (r) {
					})
				})
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
					vm.opportunity.evaluationStage = vm.stages.questions;
					vm.saveOpportunity ();
				}
				//
				// save all the proposals now with the new question rankings if applicable
				// also because this will cause scoring to run on each proposal as well
				//
				vm.saveProposals ();
			vm.responses[0][0].rank = 999;
			});
		}
		// -------------------------------------------------------------------------
		//
		// Questions Modal
		//
		// -------------------------------------------------------------------------
		vm.questions = function () {
			// vm.responses[0][0].rank = 2;
			// return;
			modalService.showModal ({
				size: 'lg',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-questions.html',
				controller: function ($scope, $uibModalInstance) {

					$scope.data = {};
					$scope.data.questions = [];
					$scope.data.proposals = vm.proposals;
					$scope.data.nproposals = vm.proposals.length;
					$scope.data.questions = vm.opportunity.questions;
					$scope.data.responses = vm.responses;
					$scope.data.totalQuestions = vm.opportunity.questions.length;
					$scope.data.currentPage = 1;

					vm.responses[0][0].rank = 999;

					$scope.close = function () {
						$uibModalInstance.close('cancel');
					};
					$scope.ok = function () {
						$uibModalInstance.close('save');
					};
					$scope.pageChanged = function () {
					};
					$scope.moveUp = function (resp, qindex) {
						var orank = resp.rank;
						var nrank = orank-1;
						vm.responses[qindex].forEach (function (r) {
							if (r.rank === orank) r.rank = nrank;
							else if (r.rank === nrank) r.rank = orank;
						});
					};
					$scope.moveDown = function (resp, qindex) {
						var orank = resp.rank;
						var nrank = orank+1;
						vm.responses[qindex].forEach (function (r) {
							if (r.rank === orank) r.rank = nrank;
							else if (r.rank === nrank) r.rank = orank;
						});
					};
					$scope.commit = function () {
						$uibModalInstance.close('commit');
					}
				}
			}, {
			})
			.then (function (resp) {
				if (resp === 'save' || resp === 'commit') {
				// vm.responses[0][0].rank = 999;
					//
					// TBD: calculate scores etc.
					//
					vm.saveProposals ();
				}
				if (resp === 'commit') {
					vm.opportunity.evaluationStage = vm.stages.interview;
					vm.saveOpportunity ();
				}
			});
		};
		// -------------------------------------------------------------------------
		//
		// Interview Modal
		//
		// -------------------------------------------------------------------------
		vm.interview = function (proposal) {
			modalService.showModal ({
				size: 'lg',
				templateUrl: '/modules/opportunities/client/views/swu-opportunity-modal-interview.html',
				controller: function ($scope, $uibModalInstance) {
					$scope.data = {
						score: proposal.scores.interview,
						name : proposal.businessName
					};
					$scope.close = function () {
						$uibModalInstance.close ();
					};
					$scope.ok = function () {
						$uibModalInstance.close ({
							action : 'save',
							score  : $scope.data.score
						});
					};
					$scope.commit = function () {
						$uibModalInstance.close ({
							action : 'commit',
							score  : $scope.data.score
						});
					}
				}
			}, {
			})
			.then (function (resp) {
				if (resp.action === 'save') {
					//
					// calculate scores etc.
					//
					proposal.scores.interview = resp.score;
					vm.saveProposal (proposal);
				}
				else if (resp.action === 'commit') {
					//
					// calculate scores and close off interview
					//
					proposal.scores.interview = resp.score;
					proposal.interviewComplete = true;
					vm.saveProposal (proposal);
					//
					// if the number of interviews complete match the number of interviews required
					// then we progress to the pricing stage
					//
					var ninterviewcomplete = 0;
					vm.proposals.forEach (function (p) {
						if (p.interviewComplete) ninterviewcomplete++;
					});
					if (ninterviewcomplete === vm.opportunity.numberOfInterviews) {
						vm.opportunity.evaluationStage = vm.stages.price;
						vm.saveOpportunity ();
						vm.calculatePriceScores ();
						vm.saveProposals ();
					}
				}
			});
		};
		vm.saveOpportunity = function () {
			vm.opportunity.$update ();
		};
		vm.assign = function (proposal) {
			vm.opportunity.proposal = proposal;
			vm.saveOpportunity ();
			proposal.isAssigned = true;
			vm.saveProposal (proposal);
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
					state: 'opportunities.viewcwu',
					params: {opportunityId:opportunity.code},
					href: $state.href('opportunities.viewcwu', {opportunityId:opportunity.code})
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
	.controller('OpportunityEditController', function ($scope, $state, $stateParams, $window, $sce, opportunity, editing, projects, Authentication, Notification, dataService, ask, TINYMCE_OPTIONS, OpportunitiesCommon) {
		var vm                                = this;
		vm.trust               				  = $sce.trustAsHtml;
		var originalPublishedState            = opportunity.isPublished;
		//
		// what can the user do here?
		//
		var isUser                            = Authentication.user;
		vm.isAdmin                            = isUser && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov                              = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.projects                           = projects;
		vm.editing                            = editing;
		vm.opportunity                        = opportunity;
		vm.opportunity.opportunityTypeCd      = 'code-with-us';
		vm.opportunity.deadline               = new Date (vm.opportunity.deadline);
		vm.opportunity.assignment             = new Date (vm.opportunity.assignment);
		vm.opportunity.start                  = new Date (vm.opportunity.start);
		vm.opportunity.endDate                = new Date (vm.opportunity.endDate);
		vm.authentication                     = Authentication;
		vm.opportunity.skilllist              = vm.opportunity.skills ? vm.opportunity.skills.join (', ') : '';
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
			vm.opportunity.deadline   = new Date ();
			vm.opportunity.assignment = new Date ();
			vm.opportunity.start      = new Date ();
			vm.opportunity.endDate    = new Date ();

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

				$state.go('opportunities.viewcwu', {opportunityId:opportunity.code});
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
