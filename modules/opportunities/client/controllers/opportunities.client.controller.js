(function () {
	'use strict';
	angular.module('opportunities')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('OpportunitiesListController', function (OpportunitiesService, Authentication, subscriptions) {
		var vm      = this;
		vm.opportunities = OpportunitiesService.query();
		var isUser = Authentication.user;
		vm.isUser = isUser;
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityViewController', function ($scope, $state, $stateParams, $sce, opportunity, Authentication, OpportunitiesService, Notification, modalService, $q, ask, subscriptions, myproposal, NotificationsService) {
		var vm                    = this;
		//
		// set the notification code for updates to this opp, and set the vm flag to current state
		//
		var notificationCode = 'not-update-'+opportunity.code;
		vm.notifyMe = subscriptions.map (function (s) {return (s.notificationCode === notificationCode);}).reduce (function (a, c) {return (a || c);}, false);

		vm.myproposal             = myproposal;
		vm.projectId              = $stateParams.projectId;
		vm.opportunity            = opportunity;
		vm.pageViews              = opportunity.views;
		vm.opportunity.deadline   = new Date (vm.opportunity.deadline);
		vm.opportunity.assignment = new Date (vm.opportunity.assignment);
		vm.opportunity.start      = new Date (vm.opportunity.start);
		vm.authentication         = Authentication;
		vm.OpportunitiesService   = OpportunitiesService;
		vm.idString               = 'opportunityId';
		vm.display                = {};
		vm.display.description    = $sce.trustAsHtml(vm.opportunity.description);
		vm.display.evaluation     = $sce.trustAsHtml(vm.opportunity.evaluation);
		vm.display.criteria       = $sce.trustAsHtml(vm.opportunity.criteria);
		//
		// what can the user do here?
		//
		var isUser                 = Authentication.user;
		var isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');
		var isGov                  = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.isGov = isGov;
		vm.hasEmail                = isUser && Authentication.user.email !== '';
		var isMemberOrWaiting      = opportunity.userIs.member || opportunity.userIs.request;
		vm.loggedIn                = isUser;
		vm.canRequestMembership    = isGov && !isMemberOrWaiting;
		vm.canApply                = isUser && !isAdmin && !isGov && !isMemberOrWaiting;
		vm.canEdit                 = isAdmin || opportunity.userIs.admin;
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
		vm.assignment = dt.getHours()+':00 PST, '+dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
		dt = vm.opportunity.start;
		vm.start = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
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
		vm.publish = function (opportunity, state) {
			var publishedState      = opportunity.isPublished;
			var t = state ? 'Published' : 'Unpublished';

			var savemeSeymour = true;
			var promise = Promise.resolve ();
			if (state) {
				var question = opportunity.wasPublished ?
					'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?' :
					'When you publish this opportunity, we\'ll notify all our subscribed users. Are you sure you\'ve got it just the way you want it?';
				promise = ask.yesNo (question).then (function (result) {
					savemeSeymour = result;
				});
			}
				promise.then(function() {
					if (savemeSeymour) {
						opportunity.isPublished = state;
						if (state) return OpportunitiesService.publish ({opportunityId:opportunity._id}).$promise;
						else return OpportunitiesService.unpublish ({opportunityId:opportunity._id}).$promise;
						// return opportunity.createOrUpdate();
					}
					else return Promise.reject ({data:{message:'Publish Cancelled'}});
				})
				.then (function (res) {
					//
					// success, notify
					//
					var m = state ? 'Your opportunity has been published and we\'ve notified subscribers!' : 'Your opportunity has been unpublished!'
					Notification.success ({
						message : '<i class="glyphicon glyphicon-ok"></i> '+m
					});
				})
				.catch (function (res) {
					//
					// fail, notify and stay put
					//
					opportunity.isPublished = publishedState;
					Notification.error ({
						message : res.data.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> Opportunity '+t+' Error!'
					});
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
					state: 'opportunities.view',
					params: {opportunityId:opportunity.code},
					href: $state.href('opportunities.view', {opportunityId:opportunity.code})
				};
            });
		};
		// -------------------------------------------------------------------------
		//
		// subscribe to changes
		//
		// -------------------------------------------------------------------------
		vm.subscribe = function (state) {
			if (state) {
				NotificationsService.subscribeNotification ({notificationId: notificationCode}).$promise
				.then (function () {
					vm.notifyMe = true;
					Notification.success ({
						message : '<i class="glyphicon glyphicon-ok"></i> You have been successfully subscribed!'
					});
				}).catch (function (res) {
					Notification.error ({
						message : res.data.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> Subscription Error!'
					});
				});
			}
			else {
				NotificationsService.unsubscribeNotification ({notificationId: notificationCode}).$promise
				.then (function () {
					vm.notifyMe = false;
					Notification.success ({
						message : '<i class="glyphicon glyphicon-ok"></i> You have been successfully un-subscribed!'
					});
				}).catch (function (res) {
					Notification.error ({
						message : res.data.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> Un-Subsciption Error!'
					});
				});
			}
		};
	})
	// =========================================================================
	//
	// Controller the view of the opportunity page
	//
	// =========================================================================
	.controller('OpportunityEditController', function ($scope, $state, $stateParams, $window, $sce, opportunity, editing, projects, Authentication, Notification, previousState, dataService, modalService, $q, ask) {
		var rightNow                          = new Date();
		var vm                                = this;
		vm.previousState                      = previousState;
		var originalPublishedState             = opportunity.isPublished;
		//
		// what can the user do here?
		//
		var isUser                            = Authentication.user;
		vm.isAdmin                            = isUser && !!~Authentication.user.roles.indexOf ('admin');
		vm.isGov                              = isUser && !!~Authentication.user.roles.indexOf ('gov');
		vm.projects                           = projects;
		// console.log ('projects             = ', projects);
		// console.log ('stateParams          = ', $stateParams);
		vm.editing                            = editing;
		vm.opportunity                        = opportunity;
		vm.opportunity.deadline               = new Date (vm.opportunity.deadline);
		vm.opportunity.assignment             = new Date (vm.opportunity.assignment);
		vm.opportunity.start                  = new Date (vm.opportunity.start)		;
		vm.authentication                     = Authentication;
		vm.form                               = {};
		vm.opportunity.skilllist              = vm.opportunity.skills ? vm.opportunity.skills.join (', ') : '';
		vm.opportunity.taglist                = vm.opportunity.tags   ? vm.opportunity.tags.join (', ')   : '';
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
		// console.log ('editing', vm.editing);
		// console.log ('programId', vm.programId);
		// console.log ('programTitle', vm.programTitle);
		// console.log ('projectId', vm.projectId);
		// console.log ('projectTitle', vm.projectTitle);
		// console.log ('context', vm.context);
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
				var projects           = [];
				vm.projects.forEach (function (o) {
					if (o.program._id === vm.programId) projects.push (o);
				});
				vm.projects = projects;
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
		}
		//
		// if there are no available projects then post a warning and kick the user back to
		// where they came from
		//
		if (vm.projects.length === 0) {
			alert ('You do not have a project for which you are able to create an opportunity. Please browse to or create a project to put the new opportunity under.');
			$state.go (previousState.name, previousState.params);
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

		vm.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     : '',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		// -------------------------------------------------------------------------
		//
		// this is used when we are setting the entire hierarchy from the project
		// select box
		//
		// -------------------------------------------------------------------------
		vm.updateProgramProject = function (selected) {
			// console.log ('selected', vm.projectobj);
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
			console.log (vm);
			vm.form.opportunityForm.$setPristine ();
			// console.log ('saving form', vm.opportunity);
			if (!isValid) {
				// console.log ('form is not valid');
				$scope.$broadcast('show-errors-check-validity', 'vm.form.opportunityForm');
				return false;
			}
			// vm.opportunity.tags   = vm.opportunity.taglist.split(/ *, */);
			// vm.opportunity.skills = vm.opportunity.skilllist.split(/ *, */);
			if (vm.opportunity.taglist !== '') {
				vm.opportunity.tags = vm.opportunity.taglist.split(/ *, */);
			} else {
				vm.opportunity.tags = [];
			}
			if (vm.opportunity.skilllist !== '') {
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
			// set the time on the 2 dates that care about it
			//
			vm.opportunity.deadline.setHours(16);
			vm.opportunity.assignment.setHours(16);

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
				// Create a new opportunity, or update the current instance
				//
	      		promise.then(function() {
					if (savemeSeymour) {
						console.log ('saving');
						// vm.opportunity.deadline   = new Date (vm.opportunity.deadline);
						// vm.opportunity.assignment = new Date (vm.opportunity.assignment);
						// vm.opportunity.start      = new Date (vm.opportunity.start);
						return vm.opportunity.createOrUpdate();
					}
					else return Promise.reject ({data:{message:'Publish Cancelled'}});
				})
				//
				// success, notify and return to list
				//
				.then (function (res) {
					console.log ('saved');
					vm.form.opportunityForm.$setPristine ();
					// console.log ('now saved the new opportunity, redirect user');
					Notification.success ({
						message : '<i class="glyphicon glyphicon-ok"></i> opportunity saved successfully!'
					});
					if (editing) {
						$state.go('opportunities.view', {opportunityId:opportunity.code});
					} else {
						$state.go('opportunities.view', {opportunityId:opportunity.code});
						// $state.go('opportunities.list');
					}
				})
				//
				// fail, notify and stay put
				//
				.catch (function (res) {
					console.log ('caught');
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
