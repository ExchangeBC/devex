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
	.controller ('ProposalViewController', function ($scope, $sce, $state, $stateParams, proposal, Authentication, ProposalsService, Notification, ask) {
		var ppp           = this;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
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
	.controller ('ProposalViewControllerModal', function ($scope, $uibModalInstance, $sce, $state, $stateParams, proposal, Authentication, ProposalsService, Notification, ask) {
		var ppp           = this;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
		// -------------------------------------------------------------------------
		//
		// close the window
		//
		// -------------------------------------------------------------------------
		ppp.close = function () {
			$uibModalInstance.dismiss('cancel');
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
							$uibModalInstance.dismiss('cancel');
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
	.controller ('ProposalEditController', function (editing, $scope, $sce, ask, Upload, $state, $stateParams, proposal, opportunity, Authentication, ProposalsService, UsersService, Notification, NotificationsService, modalService) {
		var ppp           = this;
		ppp.title         = editing ? 'Edit' : 'Create' ;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = angular.copy (Authentication.user);
		var pristineUser = angular.toJson(Authentication.user);
		ppp.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     : '',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		if (!opportunity) {
			console.error ('no opportunity was provided!');
		}
		ppp.opportunity   = opportunity;
		ppp.showEvaluation = true;
		ppp.display = {};
		ppp.display.description    = $sce.trustAsHtml(ppp.opportunity.description);
		ppp.display.evaluation     = $sce.trustAsHtml(ppp.opportunity.evaluation);
		ppp.display.criteria       = $sce.trustAsHtml(ppp.opportunity.criteria);
		if (!editing) {
			ppp.proposal.status = 'New';
		}
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
			ppp.proposal.businessName         = ppp.user.businessName;
			ppp.proposal.businessAddress      = ppp.user.businessAddress;
			ppp.proposal.businessContactName  = ppp.user.businessContactName;
			ppp.proposal.businessContactEmail = ppp.user.businessContactEmail;
			ppp.proposal.businessContactPhone = ppp.user.businessContactPhone;
		};
		// -------------------------------------------------------------------------
		//
		// save the proposal - promise
		//
		// -------------------------------------------------------------------------
		var saveproposal = function (goodmessage, badmessage) {
			copyuser ();
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
	.controller ('ProposalEditControllerModal', function (editing, $scope, $sce, ask, Upload, $uibModalInstance, $state, $stateParams, proposal, opportunity, Authentication, ProposalsService, UsersService, Notification, NotificationsService, modalService) {
		var ppp           = this;
		ppp.title         = editing ? 'Edit' : 'Create' ;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = angular.copy (Authentication.user);
		var pristineUser = angular.toJson(Authentication.user);
		ppp.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     : '',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};
		if (!opportunity) {
			console.error ('no opportunity was provided!');
		}
		ppp.opportunity   = opportunity;
		ppp.showEvaluation = true;
		ppp.display = {};
		ppp.display.description    = $sce.trustAsHtml(ppp.opportunity.description);
		ppp.display.evaluation     = $sce.trustAsHtml(ppp.opportunity.evaluation);
		ppp.display.criteria       = $sce.trustAsHtml(ppp.opportunity.criteria);
		if (!editing) {
			ppp.proposal.status = 'New';
		}
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
			ppp.proposal.businessName         = ppp.user.businessName;
			ppp.proposal.businessAddress      = ppp.user.businessAddress;
			ppp.proposal.businessContactName  = ppp.user.businessContactName;
			ppp.proposal.businessContactEmail = ppp.user.businessContactEmail;
			ppp.proposal.businessContactPhone = ppp.user.businessContactPhone;
		};
		// -------------------------------------------------------------------------
		//
		// save the proposal - promise
		//
		// -------------------------------------------------------------------------
		var saveproposal = function (goodmessage, badmessage) {
			copyuser ();
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
					$uibModalInstance.dismiss('cancel');
				}, function () {
				});
			} else {
				$uibModalInstance.dismiss('cancel');
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
							$uibModalInstance.dismiss('cancel');
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
			if (state) {
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
