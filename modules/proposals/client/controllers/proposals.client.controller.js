(function () {
	'use strict';
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
	.controller ('ProposalViewController', function ($scope, capabilities, $sce, $state, $stateParams, proposal, Authentication, ProposalsService, Notification, ask, dataService) {
		var ppp           = this;
		ppp.features = window.features;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
		console.log (ppp.proposal);
		ppp.capabilities                          = capabilities;
		//
		// what type of opportunity is this? this will determine what tabs get shown
		//
		ppp.isSprintWithUs = false;
		if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
			ppp.isSprintWithUs = true;

			var allclist = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12','c13'];
			ppp.clist = [];
			var idlist = [];

			allclist.forEach (function (id) {
				//
				// iff the capability is required
				//
				if (ppp.opportunity[id+'_minimumYears']>0) {
					var minimumYearsField = id+'_minimumYears';
					var desiredYearsField = id+'_desiredYears';
					var userYearsField    = id+'_years';
					var teamYears = [];
					var isMinimum = false;
					var totalYears = 0;
					var minYears = ppp.opportunity[minimumYearsField];
					var desYears = ppp.opportunity[desiredYearsField];
					proposal.team.forEach (function (member) {
						var userYears = member[userYearsField];
						teamYears.push ({
							years: userYears
						});
						isMinimum = isMinimum || (userYears >= minYears);
						totalYears += userYears;
					});
					if (desYears === 0) desYears = 100;
					var score = (totalYears / desYears) * 100;
					if (score > 100) score = 100;
					//
					// put the user field onto a list
					//
					idlist.push (userYearsField);
					//
					// put all the capability stuff into a list of objects
					//
					ppp.clist.push ({
						id: id,
						minimumYearsField : minimumYearsField,
						desiredYearsField : desiredYearsField,
						userYearsField : userYearsField,
						minYears : minYears,
						desYears : desYears,
						minMet : isMinimum,
						desMet : (totalYears >= desYears),
						score : (isMinimum ? score : 0),
						teamYears : teamYears,
						totalYears : totalYears
					});
				}
			});
			console.log (ppp.clist);
		}
		// -------------------------------------------------------------------------
		//
		// close the window
		//
		// -------------------------------------------------------------------------
		ppp.close = function () {
			$state.go ('opportunities.view',{opportunityId:ppp.opportunity.code});
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
							Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Proposal Assignment successful!'});
							$state.go ('opportunities.view',{opportunityId:ppp.opportunity.code});
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Proposal Assignment failed!' });
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
	.controller ('ProposalEditController', function (uibButtonConfig, capabilities, editing, $scope, $sce, ask, Upload, $state, $stateParams, proposal, opportunity, Authentication, ProposalsService, UsersService, Notification, NotificationsService, modalService, dataService, org) {
		var isInArray = function (a,el) {return a.map (function(al){return (el===al);}).reduce(function(a,c){return (a||c);},false); };
		var ppp                                   = this;
		ppp.features                              = window.features;
		ppp.org                                   = org;
		if (org) ppp.org.fullAddress = ppp.org.address + (ppp.org.address?', '+ppp.org.address:'') + ', ' + ppp.org.city + ', ' + ppp.org.province+ ', ' + ppp.org.postalcode ;
		ppp.members = [];
		if (org) ppp.members                      = org.members.concat (org.admins);
		ppp.title                                 = editing ? 'Edit' : 'Create' ;
		if (!proposal.team) proposal.team = [];
		ppp.proposal                              = angular.copy (proposal);
		ppp.user                                  = angular.copy (Authentication.user);
		var pristineUser                          = angular.toJson(Authentication.user);
		ppp.capabilities                          = capabilities;
		ppp.totals = {};
		ppp.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     : '',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		//
		// check we have an opp
		//
		if (!opportunity) {
			console.error ('no opportunity was provided!');
		}
		ppp.opportunity   = opportunity;
		//
		// set up the html display stuff
		//
		ppp.display = {};
		ppp.display.description    = $sce.trustAsHtml(ppp.opportunity.description);
		ppp.display.evaluation     = $sce.trustAsHtml(ppp.opportunity.evaluation);
		ppp.display.criteria       = $sce.trustAsHtml(ppp.opportunity.criteria);
		uibButtonConfig.activeClass = 'cbg-light-steel-blue';
		//
		// ensure status set accordingly
		//
		if (!editing) {
			ppp.proposal.status = 'New';
		}
		//
		// what type of opportunity is this? this will determine what tabs get shown
		//
		ppp.isSprintWithUs = false;
		if (opportunity.opportunityTypeCd === 'sprint-with-us') {
			ppp.isSprintWithUs = true;
			ppp.proposal.isCompany = true;
		}
		//
		// what capabilities are required ?
		//
		if (ppp.isSprintWithUs) {
			var allclist = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12','c13'];
			ppp.clist = [];
			var idlist = [];

			allclist.forEach (function (id) {
				//
				// iff the capability is required
				//
				if (ppp.opportunity[id+'_minimumYears']>0) {
					var minimumYearsField = id+'_minimumYears';
					var desiredYearsField = id+'_desiredYears';
					var userYearsField    = id+'_years';
					//
					// put the user field onto a list
					//
					idlist.push (userYearsField);
					//
					// put all the capability stuff into a list of objects
					//
					ppp.clist.push ({
						id: id,
						minimumYearsField : minimumYearsField,
						desiredYearsField : desiredYearsField,
						userYearsField : userYearsField,
						minYears : ppp.opportunity[minimumYearsField],
						desYears : ppp.opportunity[desiredYearsField],
						minMet : false,
						desMet : false
					});
				}
			});
			console.log (ppp.clist);
			//
			// now gather up ONLY those folks who have at least one of the required capabilities
			// this should include any current team members
			//
			ppp.winners = [];
			console.log ('team:' , ppp.proposal.team);
			ppp.members.forEach (function (member) {
				member.selected = isInArray (ppp.proposal.team.map(function(a){return a._id;}), member._id);
				console.log (member._id, member.selected);
				//
				// add up their scores on all required capabilities, if > 0 include them
				//
				var score = idlist.map (function (userfield) {
					return member[userfield] || 0;
				}).reduce (function (accum, elem) {
					return accum + elem;
				});
				if (score > 0) ppp.winners.push (member);
			});
			console.log (ppp.winners);
		}
		// -------------------------------------------------------------------------
		//
		// run through and figure out how the team stacks up
		// this gets run on load as well, the call immediately follows the definition
		//
		// -------------------------------------------------------------------------
		ppp.calculateScores = function () {
			if (!ppp.isSprintWithUs) return;
			ppp.clist.forEach (function (row) {
					//
					// map the winners into an array indicating total
					// years experience of all members and if any one has met the min
					//
					var scores = ppp.winners.map (function (member) {
						var years = member[row.userYearsField];
						if (!member.selected) return [false, 0];
						else return [
							(years >= row.minYears),
							years
						];
					})
					.reduce (function (accum, elem) {
						return [
							(accum[0] || elem[0]),
							accum[1] + elem[1]
						];
					}, [false, 0]);
					// console.log (row.code, scores);
					row.minMet = scores[0];
					row.desMet = scores[1] >= row.desYears;
			console.log (row);
			});
		};
		ppp.calculateScores ();
		// -------------------------------------------------------------------------
		//
		// these are helpers for setting ui colours and text
		//
		// -------------------------------------------------------------------------
		ppp.statusColour = function (status) {
			if (status === 'New') return 'label-default';
			else if (status === 'Draft') return 'label-primary';
			else if (status === 'Submitted') return 'label-success';
		};
		ppp.saveText = function (status) {
			if (status === 'New') return 'Save';
			else if (status === 'Draft') return 'Submit';
			else if (status === 'Submitted') return 'label-success';
		}
		// -------------------------------------------------------------------------
		//
		// things to do with leaving the form without saving
		//
		// -------------------------------------------------------------------------
		var saveChangesModalOpt = {
			closeButtonText: 'Return To Proposal',
			actionButtonText: 'Continue',
			headerText: 'Unsaved Changes!',
			bodyText: 'You have unsaved changes. Changes will be discarded if you continue.'
		};
		var pristineProposal = angular.toJson (ppp.proposal);
		var $locationChangeStartUnbind = $scope.$on ('$stateChangeStart', function (event, toState, toParams) {
			if (pristineProposal !== angular.toJson (ppp.proposal) || pristineUser !== angular.toJson (ppp.user)) {
				if (toState.retryInProgress) {
					toState.retryInProgress = false;
					return;
				}
				modalService.showModal ({}, saveChangesModalOpt)
				.then(function  () {
					toState.retryInProgress = true;
					$state.go(toState, toParams);
				}, function () {
				});
				event.preventDefault();
			}
		});
		window.onbeforeunload = function() {
			if (pristineProposal !== angular.toJson (ppp.proposal)) {
				return 'onbeforeunload: You are about to leave the page with unsaved data. Click Cancel to remain here.';
			}
		};
		$scope.$on('$destroy', function () {
			window.onbeforeunload = null;
			$locationChangeStartUnbind ();
		});
		// -------------------------------------------------------------------------
		//
		// team score
		//
		// -------------------------------------------------------------------------
		ppp.teamScore = function (team) {
			return 50;
		};
		ppp.memberScore = function (member) {
			return 100;
		};
		// -------------------------------------------------------------------------
		//
		// save the user - promise
		//
		// -------------------------------------------------------------------------
		var saveuser = function () {
			return new Promise (function (resolve, reject) {
				if (pristineUser !== angular.toJson(ppp.user)) {
					UsersService.update (ppp.user).$promise
					.then (
						function (response) {
							Authentication.user = response;
							ppp.user = angular.copy(Authentication.user);
							pristineUser = angular.toJson(Authentication.user);
							resolve ();
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit profile failed!' });
							 reject ();
						}
					);
				} else resolve ();
			});
		};
		// -------------------------------------------------------------------------
		//
		// copy over stuff
		//
		// -------------------------------------------------------------------------
		var copyuser = function () {
			ppp.proposal.opportunity          = ppp.opportunity;
			if (!ppp.isSprintWithUs) {
				ppp.proposal.businessName         = ppp.user.businessName;
				ppp.proposal.businessAddress      = ppp.user.businessAddress;
				ppp.proposal.businessContactName  = ppp.user.businessContactName;
				ppp.proposal.businessContactEmail = ppp.user.businessContactEmail;
				ppp.proposal.businessContactPhone = ppp.user.businessContactPhone;
			} else {
				ppp.proposal.businessName         = ppp.org.name;
				ppp.proposal.businessAddress      = ppp.org.fullAddress;
				ppp.proposal.businessContactName  = ppp.org.contactName;
				ppp.proposal.businessContactEmail = ppp.org.contactEmail;
				ppp.proposal.businessContactPhone = ppp.org.contactPhone;
			}
		};
		// -------------------------------------------------------------------------
		//
		// set the team from the winners circle
		//
		// -------------------------------------------------------------------------
		var copyteam = function () {
			if (ppp.isSprintWithUs) {
				ppp.proposal.team = [];
				ppp.winners.forEach (function (m) {
					if (m.selected) ppp.proposal.team.push (m._id);
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the proposal - promise
		//
		// -------------------------------------------------------------------------
		var saveproposal = function (goodmessage, badmessage) {
			copyuser ();
			copyteam ();
			return new Promise (function (resolve, reject) {
				ppp.proposal.createOrUpdate ()
				.then (
					function (response) {
						Notification.success({ message: goodmessage || '<i class="glyphicon glyphicon-ok"></i> Your changes have been saved.'});
						ppp.proposal = response;
						pristineProposal = angular.toJson (ppp.proposal);
						ppp.subscribe (true);
						resolve ();
					},
					function (error) {
						 Notification.error ({ message: badmessage || error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit Proposal failed!' });
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
			saveuser().then (saveproposal);
		};
		// -------------------------------------------------------------------------
		//
		// leave without saving any work
		//
		// -------------------------------------------------------------------------
		ppp.close = function () {
			if (pristineProposal !== angular.toJson (ppp.proposal)) {
				modalService.showModal ({}, saveChangesModalOpt)
				.then(function () {
					window.onbeforeunload = null;
					$locationChangeStartUnbind ();
					$state.go ('opportunities.view',{opportunityId:ppp.opportunity.code});
				}, function () {
				});
			} else {
				$state.go ('opportunities.view',{opportunityId:ppp.opportunity.code});
			}
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
							Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Remove Proposal successful'});
							ppp.subscribe (false);
							$state.go ('opportunities.view',{opportunityId:ppp.opportunity.code});
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Remove Proposal failed!' });
						}
					);
				}
			});
		};
		var performwithdrawal = function (txt) {
					ppp.proposal.status = 'Draft';
					saveuser().then (function () {saveproposal ('Your proposal has been withdrawn.')});
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
			saveuser().then (function () {
				copyuser ();
				ProposalsService.submit (ppp.proposal).$promise
				.then (
					function (response) {
						ppp.proposal = response;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Your proposal has been submitted!'});
					},
					function (error) {
						 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Error Submitting Proposal' });
					}
				);
			});
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
					ppp.proposal = response.data;
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Attachment Uploaded'});
				},
				function (response) {
					Notification.error ({ message: response.data, title: '<i class="glyphicon glyphicon-remove"></i> Error Uploading Attachment' });
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
				$scope.$apply();
			});
		};
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
	})
	;
}());
