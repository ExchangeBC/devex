(function () {
	'use strict';
	angular.module('proposals')
	// =========================================================================
	//
	// Controller the view of the proposal page
	//
	// =========================================================================
	.controller ('ProposalViewController', ['capabilities', '$sce', '$state', 'proposal', 'ProposalsService', 'OpportunitiesService', 'Notification', 'ask', function (capabilities, $sce, $state, proposal, ProposalsService, OpportunitiesService, Notification, ask) {
		var ppp           = this;
		ppp.proposal      = angular.copy (proposal);
		ppp.user          = ppp.proposal.user;
		ppp.opportunity   = ppp.proposal.opportunity;
		ppp.detail        = $sce.trustAsHtml(ppp.proposal.detail);
		ppp.capabilities  = capabilities;
		//
		// what type of opportunity is this? this will determine what tabs get shown
		//
		ppp.isSprintWithUs = true;
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
		}
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
		// -------------------------------------------------------------------------
		//
		// Get a font-awesome icon name for the given file type
		//
		// -------------------------------------------------------------------------
		ppp.getIconName = function (type) {
			if (type.indexOf ('pdf') > -1) {
				return 'fa-file-pdf';
			}
			else if (type.indexOf ('image') > -1) {
				return 'fa-file-image';
			}
			else if (type.indexOf ('word') > -1) {
				return 'fa-file-word';
			}
			else if (type.indexOf ('excel') > -1 || type.indexOf('sheet') > -1) {
				return 'fa-file-excel';
			}
			else if (type.indexOf ('powerpoint') > -1) {
				return 'fa-file-powerpoint';
			}
			else {
				return 'fa-file'
			}
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
					OpportunitiesService.assign({ opportunityId: ppp.opportunity.code, proposalId: ppp.proposal._id }).$promise
					.then (
						function (response) {
							ppp.proposal = response;
							Notification.success({ message: '<i class="fas fa-check-circle"></i> Proposal has been assigned'});
							if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
								$state.go ('opportunities.viewswu',{opportunityId:ppp.opportunity.code});
							} else {
								$state.go ('opportunities.viewcwu',{opportunityId:ppp.opportunity.code});
							}
						},
						function (error) {
							 Notification.error ({ message: error.data.message, title: '<i class="fas fa-exclamation-triangle"></i> Proposal Assignment failed!' });
						}
					);
				}
			});
		};
	}])
	// =========================================================================
	//
	// Controller the view of the proposal page
	//
	// =========================================================================
	.controller ('ProposalEditController', ['uibButtonConfig', 'capabilities', 'editing', '$scope', '$sce', 'ask', 'Upload', '$state', 'proposal', 'opportunity', 'Authentication', 'ProposalsService', 'OpportunitiesService', 'UsersService', 'Notification', 'CapabilitiesMethods', 'org', 'TINYMCE_OPTIONS', function (uibButtonConfig, capabilities, editing, $scope, $sce, ask, Upload, $state, proposal, opportunity, Authentication, ProposalsService, OpportunitiesService, UsersService, Notification, CapabilitiesMethods, org, TINYMCE_OPTIONS) {

		var ppp              = this;

		//
		// check we have an opp
		//
		if (!opportunity) {
			console.error ('no opportunity was provided!');
			$state.go('home');
		}
		ppp.opportunity   = opportunity;
		ppp.org                                   = org;
		if (org) ppp.org.fullAddress = ppp.org.address + (ppp.org.address2?', '+ppp.org.address2:'') + ', ' + ppp.org.city + ', ' + ppp.org.province+ ', ' + ppp.org.postalcode ;
		ppp.members = [];
		if (org) ppp.members                      = org.members.concat (org.admins);
		ppp.title                                 = editing ? 'Edit' : 'Create' ;
		if (!proposal.team) proposal.team = [];
		ppp.proposal                              = angular.copy (proposal);
		ppp.user                                  = angular.copy (Authentication.user);
		var pristineUser                          = angular.toJson(Authentication.user);

		//
		// set up the structures for capabilities
		//
		CapabilitiesMethods.init (ppp, ppp.opportunity, capabilities);
		CapabilitiesMethods.dump (ppp, ppp.opportunity, capabilities);

		ppp.totals = {};
		ppp.tinymceOptions = TINYMCE_OPTIONS;

		//
		// ensure status set accordingly
		//
		if (!editing) {
			ppp.proposal.status = 'New';
		}

		// -------------------------------------------------------------------------
		//
		// Save the passed in user
		//
		// -------------------------------------------------------------------------
		var saveUser = function(userToSave) {
			return new Promise(function(resolve, reject) {
				if (pristineUser !== angular.toJson(userToSave)) {
					UsersService.update(userToSave).$promise
					.then(
						function(updatedUser) {
							Authentication.user = updatedUser;
							ppp.user = angular.copy(Authentication.user);
							pristineUser = angular.toJson(Authentication.user);
							resolve();
						},
						function(error) {
							Notification.error ({
								message: error.data.message,
								title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Edit profile failed!'
							});
							reject ();
						}
					);
				} else {
					resolve();
				}
			});
		};

		// -------------------------------------------------------------------------
		//
		// Copy over user and org information to the proposal
		//
		// -------------------------------------------------------------------------
		var copyUserInfo = function(proposalToModify) {
			proposalToModify.opportunity          = ppp.opportunity;

			proposalToModify.businessName         = ppp.user.businessName;
			proposalToModify.businessAddress      = ppp.user.businessAddress;
			proposalToModify.businessContactName  = ppp.user.businessContactName;
			proposalToModify.businessContactEmail = ppp.user.businessContactEmail;
			proposalToModify.businessContactPhone = ppp.user.businessContactPhone;
		};

		// -------------------------------------------------------------------------
		//
		// Save the passed in proposal
		//
		// -------------------------------------------------------------------------
		var saveProposal = function(proposalToSave) {

			return OpportunitiesService.getDeadlineStatus({ opportunityId: ppp.opportunity._id }).$promise
			.then(function(response) {
				if (response.deadlineStatus === 'CLOSED') {
					return Promise.reject({
						title: 'Error',
						message: 'The opportunity deadline has passed.'
					});
				}
				else {
					copyUserInfo(proposalToSave);
					return new Promise(function(resolve, reject) {
						proposalToSave.createOrUpdate()
						.then(function(updatedProposal) {
							resolve({
								savedProposal: updatedProposal,
								title: 'Success',
								message: '<i class="fas fa-check-circle"></i> Changes Saved'
							});
						},
						function (error) {
							reject({
								title: 'Error',
								message: '<i class="fas fa-exclamation-triangle"></i> Error: ' + error.message
							});
						});
					})
				}
			});
		};

		// -------------------------------------------------------------------------
		//
		// Save the proposal
		//
		// -------------------------------------------------------------------------
		ppp.save = function(isValid) {
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'ppp.form.proposalform');
				return false;
			}
			var userToSave = angular.copy(ppp.user);
			var proposalToSave = angular.copy(ppp.proposal);
			saveUser(userToSave)
			.then(function() {
				saveProposal(proposalToSave)
				.then(function(response) {
					ppp.proposal = response.savedProposal;
					ppp.form.proposalform.$setPristine();
					Notification.success({
						title: response.title,
						message: response.message
					});
				})
				.catch(function(error) {
					Notification.error({
						title: error.title,
						message: error.message
					});
				})
			});
		};

		// -------------------------------------------------------------------------
		//
		// Leave the edit view
		//
		// -------------------------------------------------------------------------
		ppp.close = function() {
			$state.go ('opportunities.viewcwu',{opportunityId:ppp.opportunity.code});
		};

		// -------------------------------------------------------------------------
		//
		// Delete a proposal
		//
		// -------------------------------------------------------------------------
		ppp.delete = function() {
			var confirmMessage = 'Are you sure you want to delete your proposal? All your work will be lost.';
			ask.yesNo(confirmMessage)
			.then(function(choice) {
				if (choice) {
					ppp.proposal.$remove(function() {
						Notification.success({
							message: '<i class="fas fa-trash"></i> Proposal Deleted'});
						ppp.form.proposalform.$setPristine();
						$state.go ('opportunities.viewcwu', {opportunityId:ppp.opportunity.code});
					},
					function(error) {
						Notification.error({
							title: 'Error',
							message: '<i class="fas fa-exclamation-triangle"></i> ' + error.data.message
						});
					});
				}
			});
		};

		// -------------------------------------------------------------------------
		//
		// Withdraw a submitted proposal
		//
		// -------------------------------------------------------------------------
		ppp.withdraw = function() {
			ppp.proposal.status = 'Draft';

			var proposalToSave = angular.copy(ppp.proposal);
			saveProposal(proposalToSave)
			.then(function(response) {
				ppp.proposal = response.savedProposal;
				Notification.success({
					title: 'Success',
					message: '<i class="fas fa-check-circle"></i> Proposal Withdrawn'
				});
			})
			.catch(function(error) {
				Notification.error({
					title: error.title,
					message: error.message
				});
			})
		};

		// -------------------------------------------------------------------------
		//
		// Submit the proposal
		//
		// -------------------------------------------------------------------------
		ppp.submit = function() {
			var userToSave = angular.copy(Authentication.user);
			var proposalToSave = angular.copy(ppp.proposal);
			saveUser(userToSave)
			.then(function() {
				OpportunitiesService.getDeadlineStatus({ opportunityId: ppp.opportunity._id }).$promise
				.then(function(response) {
					if (response.deadlineStatus === 'CLOSED') {
						Notification.error({
							title: 'Error',
							message: 'The opportunity deadline has passed'
						});
					}
					else {
						copyUserInfo(proposalToSave);
						proposalToSave.status = 'Submitted';
						saveProposal(proposalToSave)
						.then(function(updatedProposal) {
							ppp.proposal = updatedProposal;
							ppp.form.proposalform.$setPristine();
							Notification.success({
								title: 'Success',
								message: '<i class="fas fa-check-circle"></i>Your proposal has been submitted'
							});
							$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });

						}, function(error) {
							Notification.error ({
								title: 'Error',
								message: '<i class="fas fa-exclamation-triangle"></i> Error Submitting Proposal: ' + error.data.message });
						});
					}
				})
			});
		}

		// -------------------------------------------------------------------------
		//
		// Upload documents as attachments to proposal
		//
		// -------------------------------------------------------------------------
		ppp.upload = function (file) {

			if (!file) {
				return;
			}

			if (file.size > (3 * 1024 * 1024)) {
				Notification.error ({
					delay   : 6000,
					title   : '<div class="text-center"><i class="fas fa-exclamation-triangle"></i> File Too Large</div>',
					message : '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
				});
			}
			else {
				Upload.upload({
					url: '/api/proposals/'+ppp.proposal._id+'/documents',
					data: {
						file: file
					}
				})
				.then(
					function (response) {
						ppp.proposal = new ProposalsService(response.data);
						Notification.success({ message: '<i class="fas fa-check-circle"></i> Attachment Uploaded' });
					},
					function (response) {
						Notification.error ({ message: response.data, title: '<i class="fas fa-exclamation-triangle"></i> Error Uploading Attachment' });
					},
					function (evt) {
						ppp.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
				});
			}
		};

		// -------------------------------------------------------------------------
		//
		// Delete an attachment from a proposal
		//
		// -------------------------------------------------------------------------
		ppp.deleteAttachment = function(fileId) {
			ProposalsService.removeDoc ({
				proposalId: ppp.proposal._id,
				documentId: fileId
			}).$promise
			.then (function (doc) {
				ppp.proposal = doc;
			});
		};

		// -------------------------------------------------------------------------
		//
		// Get a font-awesome icon name for the given file type
		//
		// -------------------------------------------------------------------------
		ppp.getIconName = function (type) {
			if (type.indexOf ('pdf') > -1) {
				return 'fa-file-pdf';
			}
			else if (type.indexOf ('image') > -1) {
				return 'fa-file-image';
			}
			else if (type.indexOf ('word') > -1) {
				return 'fa-file-word';
			}
			else if (type.indexOf ('excel') > -1 || type.indexOf('sheet') > -1) {
				return 'fa-file-excel';
			}
			else if (type.indexOf ('powerpoint') > -1) {
				return 'fa-file-powerpoint';
			}
			else {
				return 'fa-file'
			}
		};
	}])
	;
}());
