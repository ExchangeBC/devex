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
	.controller ('ProposalViewSWUController', function ($scope, capabilities, $sce, $state, proposal, Authentication, ProposalsService, Notification, ask, dataService) {
		var ppp           = this;
		ppp.features = window.features;
		ppp.proposal      = proposal;
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
		// console.log (ppp.proposal);
		ppp.capabilities                          = capabilities;
		//
		// what type of opportunity is this? this will determine what tabs get shown
		//
		ppp.isSprintWithUs = false;
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
							Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Proposal Assignment successful!'});
							if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
								$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
							} else {
								$state.go ('opportunities.viewcwu',{opportunityId:ppp.opportunity.code});
							}
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
	.controller ('ProposalEditSWUController', function (capabilities, editing, $scope, $sce, ask, Upload, $state, proposal, opportunity, Authentication, ProposalsService, Notification, NotificationsService, dataService, CapabilitiesMethods, org, TINYMCE_OPTIONS, resources) {
		var isInArray = function (a,el) {return a.map (function(al){return (el===al);}).reduce(function(a,c){return (a||c);},false); };
		var ppp                                   = this;
		ppp.features                              = window.features;
		ppp.trust            = $sce.trustAsHtml;
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
		if (org) ppp.org.fullAddress = ppp.org.address + (ppp.org.address?', '+ppp.org.address:'') + ', ' + ppp.org.city + ', ' + ppp.org.province+ ', ' + ppp.org.postalcode ;
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
		ppp.p_imp = ppp.proposal.phases.implementation;
		ppp.p_inp = ppp.proposal.phases.inception;
		ppp.p_prp = ppp.proposal.phases.proto;
		ppp.p_agg = ppp.proposal.phases.aggregate;
		ppp.oimp  = ppp.opportunity.phases.implementation;
		ppp.oinp  = ppp.opportunity.phases.inception;
		ppp.oprp  = ppp.opportunity.phases.proto;
		ppp.oagg  = ppp.opportunity.phases.aggregate;
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
		CapabilitiesMethods.dump (ppp.inp, 'inception');
		CapabilitiesMethods.dump (ppp.prp, 'prototype');
		CapabilitiesMethods.dump (ppp.imp, 'implementation');

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
		// console.log ('questions', ppp.proposal.questions);

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
		// -------------------------------------------------------------------------
		//
		// save the proposal - promise
		//
		// -------------------------------------------------------------------------
		var saveproposal = function (goodmessage, badmessage) {
			ppp.proposal.opportunity          = ppp.opportunity;
			ppp.proposal.businessName         = ppp.org.name;
			ppp.proposal.businessAddress      = ppp.org.fullAddress;
			ppp.proposal.businessContactName  = ppp.org.contactName;
			ppp.proposal.businessContactEmail = ppp.org.contactEmail;
			ppp.proposal.businessContactPhone = ppp.org.contactPhone;
			return new Promise (function (resolve, reject) {
				ppp.proposal.createOrUpdate ()
				.then (
					function (response) {
						Notification.success({ message: goodmessage || '<i class="glyphicon glyphicon-ok"></i> Your changes have been saved.'});
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
							Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Remove Proposal successful'});
							ppp.subscribe (false);
							$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
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
			saveproposal ('Your proposal has been withdrawn.');
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
			ppp.proposal.opportunity          = ppp.opportunity;
			ppp.proposal.businessName         = ppp.org.name;
			ppp.proposal.businessAddress      = ppp.org.fullAddress;
			ppp.proposal.businessContactName  = ppp.org.contactName;
			ppp.proposal.businessContactEmail = ppp.org.contactEmail;
			ppp.proposal.businessContactPhone = ppp.org.contactPhone;
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
