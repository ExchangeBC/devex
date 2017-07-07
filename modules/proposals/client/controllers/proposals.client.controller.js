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
	.controller ('ProposalEditController', function (editing, $scope, $sce, ask, $uibModalInstance, $state, $stateParams, proposal, opportunity, Authentication, ProposalsService, UsersService, Notification) {
		var ppp           = this;
		// $scope.vm        = ppp;
		ppp.title         = editing ? 'Edit' : 'Create' ;
		console.log ('prop', proposal);
		ppp.proposal      = angular.copy (proposal);
		console.log ('ppp.proposal', ppp.proposal);
		ppp.user          = angular.copy (Authentication.user);
		var pristineUser = angular.toJson(Authentication.user);
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
		var saveproposal = function () {
			copyuser ();
			return new Promise (function (resolve, reject) {
				ppp.proposal.createOrUpdate ()
				.then (
					function (response) {
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Edit Proposal successful'});
						ppp.proposal = response;
						resolve ();
					},
					function (error) {
						 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Edit Proposal failed!' });
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
			console.log ('saving!!!!!');
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
							$uibModalInstance.dismiss('cancel');
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Remove Proposal failed!' });
						}
					);
				}
			})
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a draft
		//
		// -------------------------------------------------------------------------
		ppp.delete = function () {
			performdelete ('Are you sure you wish to delete this draft proposal?');
		};
		// -------------------------------------------------------------------------
		//
		// this deletes a submission
		//
		// -------------------------------------------------------------------------
		ppp.withdraw = function () {
			performdelete ('Are you sure you wish to withdraw and delete this proposal?');
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
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Proposal Submitted'});
					},
					function (error) {
						 Notification.error ({ message: error.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Error Submitting Proposal' });
					}
				);
			});


		}
	})
	;
}());
