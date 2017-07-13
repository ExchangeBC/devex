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
	.controller ('ProposalViewController', function ($scope, $uibModalInstance, $sce, $state, $stateParams, proposal, Authentication, ProposalsService, Notification) {
		var ppp           = this;

		ppp.save = function (result) {
			console.log ('view saving!!!!!');
			$uibModalInstance.close(result);
		};
		ppp.close = function (result) {
			console.log ('closing!!!!!');
			$uibModalInstance.dismiss('cancel');
		};
	})
	// =========================================================================
	//
	// Controller the view of the proposal page
	//
	// =========================================================================
	.controller ('ProposalEditController', function (editing, $scope, $sce, ask, Upload, $uibModalInstance, $state, $stateParams, proposal, opportunity, Authentication, ProposalsService, UsersService, Notification, NotificationsService) {
		var ppp           = this;
		// $scope.vm        = ppp;
		ppp.title         = editing ? 'Edit' : 'Create' ;
		console.log ('prop', proposal);
		ppp.proposal      = angular.copy (proposal);
		console.log ('ppp.proposal', ppp.proposal);
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
		console.log ('ppp.user', ppp.user);
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
		// save the user - promise
		//
		// -------------------------------------------------------------------------
		var saveuser = function () {
			return new Promise (function (resolve, reject) {
				if (pristineUser !== angular.toJson(ppp.user)) {
					console.log ('ppp.user._id', ppp.user._id);
					// var nu = new UsersService.$update (ppp.user);
					// console.log ('nu._id', nu);
					// nu.$update (
					UsersService.update (ppp.user).$promise
					.then (
						function (response) {
							// Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Edit profile successful'});
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

			// $uibModalInstance.close('ok');
		};
		// -------------------------------------------------------------------------
		//
		// leave without saving any work
		//
		// -------------------------------------------------------------------------
		ppp.close = function (result) {
			console.log ('closing!!!!!');
			$uibModalInstance.dismiss('cancel');

			// var $locationChangeStartUnbind = $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
			// 		// console.log ('started stateChangeStart');
			// 		if ($scope.parentForm.$dirty) {
			// 			if ( !confirm('You are about to leave the page with unsaved data. Click Cancel to remain here.') ) {
			// 				// console.log ('stateChangeStart please don\'t leave!!!!!!');
			// 				// cancel to not allow.
			// 				event.preventDefault();
			// 				// console.log (event);
			// 				return false;
			// 			}
			// 		}
			// 	});


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
						function (response) {
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
		var performwithdrawal = function (q) {
			// ask.yesNo (q).then (function (r) {
			// 	if (r) {
					ppp.proposal.status = 'Draft';
					saveuser().then (function () {saveproposal ('Your proposal has been withdrawn.')});
			// 	}
			// });
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a draft
		//
		// -------------------------------------------------------------------------
		ppp.delete = function () {
			performdelete ('Are you sure you want to delete your proposal? All your work will be lost. There is no undo for this!', 'Delete my proposal');
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a submission
		//
		// -------------------------------------------------------------------------
		ppp.withdraw = function () {
			performwithdrawal ('Are you sure you want to withdraw this proposal?');
		};
		// -------------------------------------------------------------------------
		//
		// submit the proposal
		//
		// -------------------------------------------------------------------------
		ppp.submit = function () {
			console.log ('submitting!!!!!');
			saveuser().then (function () {
				copyuser ();
				ProposalsService.submit (ppp.proposal).$promise
				.then (
					function (response) {
						console.log ('response = ', response);
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
			// console.log ('name = ', name);
			console.log ('uploading!', file);
			Upload.upload({
				url: '/api/proposal/'+ppp.proposal._id+'/upload/doc',
				data: {
					file: file
				}
			})
			.then(
				function (response) {
					console.log ('response', response);
					ppp.proposal = response.data;
					Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Attachment Uploaded'});
				},
				function (response) {
					console.log (response.data);
					Notification.error ({ message: response.data, title: '<i class="glyphicon glyphicon-remove"></i> Error Uploading Attachment' });
				},
				function (evt) {
					ppp.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
			});

		};
		ppp.deletefile = function (fileid) {
			console.log ('fileid', fileid);
			ProposalsService.removeDoc ({
				proposalId: ppp.proposal._id,
				documentId: fileid
			}).$promise
			.then (function (doc) {
				console.log ('doc', doc);
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
					ppp.notifyMe = false;
				}).catch (function (res) {
					Notification.error ({
						message : res.data.message,
						title   : '<i class=\'glyphicon glyphicon-remove\'></i> Un-Subsciption Error!'
					});
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
