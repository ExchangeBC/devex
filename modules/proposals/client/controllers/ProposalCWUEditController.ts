'use strict';

(() => {
	angular
		.module('proposals')

		// Controller the view of the proposal page
		.controller('ProposalCWUEditController', [
			'uibButtonConfig',
			'capabilities',
			'editing',
			'$scope',
			'$sce',
			'ask',
			'Upload',
			'$state',
			'proposal',
			'opportunity',
			'Authentication',
			'ProposalsService',
			'OpportunitiesService',
			'UsersService',
			'Notification',
			'CapabilitiesMethods',
			'org',
			'TINYMCE_OPTIONS',
			function(
				uibButtonConfig,
				capabilities,
				editing,
				$scope,
				$sce,
				ask,
				Upload,
				$state,
				proposal,
				opportunity,
				Authentication,
				ProposalsService,
				OpportunitiesService,
				UsersService,
				Notification,
				CapabilitiesMethods,
				org,
				TINYMCE_OPTIONS
			) {
				const ppp = this;

				// check we have an opp
				if (!opportunity) {
					$state.go('home');
				}
				ppp.opportunity = opportunity;
				ppp.org = org;
				if (org) {
					ppp.org.fullAddress = ppp.org.address + (ppp.org.address2 ? ', ' + ppp.org.address2 : '') + ', ' + ppp.org.city + ', ' + ppp.org.province + ', ' + ppp.org.postalcode;
				}
				ppp.members = [];
				if (org) {
					ppp.members = org.members.concat(org.admins);
				}
				ppp.title = editing ? 'Edit' : 'Create';
				if (!proposal.team) {
					proposal.team = [];
				}
				ppp.proposal = angular.copy(proposal);
				ppp.user = angular.copy(Authentication.user);
				let pristineUser = angular.toJson(Authentication.user);

				//
				// set up the structures for capabilities
				//
				CapabilitiesMethods.init(ppp, ppp.opportunity, capabilities);
				CapabilitiesMethods.dump(ppp, ppp.opportunity, capabilities);

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
				const saveUser = userToSave => {
					return new Promise((resolve, reject) => {
						if (pristineUser !== angular.toJson(userToSave)) {
							UsersService.update(userToSave).$promise.then(
								updatedUser => {
									Authentication.user = updatedUser;
									ppp.user = angular.copy(Authentication.user);
									pristineUser = angular.toJson(Authentication.user);
									resolve();
								},
								error => {
									Notification.error({
										message: error.data.message,
										title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Edit profile failed!'
									});
									reject();
								}
							);
						} else {
							resolve();
						}
					});
				};

				// Copy over user and org information to the proposal
				const copyUserInfo = proposalToModify => {
					proposalToModify.opportunity = ppp.opportunity;

					proposalToModify.businessName = ppp.user.businessName;
					proposalToModify.businessAddress = ppp.user.businessAddress;
					proposalToModify.businessContactName = ppp.user.businessContactName;
					proposalToModify.businessContactEmail = ppp.user.businessContactEmail;
					proposalToModify.businessContactPhone = ppp.user.businessContactPhone;
				};

				// Save the passed in proposal
				const saveProposal = proposalToSave => {
					return OpportunitiesService.getDeadlineStatus({ opportunityId: ppp.opportunity._id }).$promise.then(response => {
						if (response.deadlineStatus === 'CLOSED') {
							return Promise.reject({
								title: 'Error',
								message: 'The opportunity deadline has passed.'
							});
						} else {
							copyUserInfo(proposalToSave);
							return new Promise((resolve, reject) => {
								proposalToSave.createOrUpdate().then(
									updatedProposal => {
										resolve({
											savedProposal: updatedProposal,
											title: 'Success',
											message: '<i class="fas fa-check-circle"></i> Changes Saved'
										});
									},
									error => {
										reject({
											title: 'Error',
											message: '<i class="fas fa-exclamation-triangle"></i> Error: ' + error.message
										});
									}
								);
							});
						}
					});
				};

				// Save the proposal
				ppp.save = isValid => {
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'ppp.form.proposalform');
						return false;
					}
					const userToSave = angular.copy(ppp.user);
					const proposalToSave = angular.copy(ppp.proposal);
					saveUser(userToSave).then(() => {
						saveProposal(proposalToSave)
							.then(response => {
								ppp.proposal = response.savedProposal;
								ppp.form.proposalform.$setPristine();
								Notification.success({
									title: response.title,
									message: response.message
								});
							})
							.catch(error => {
								Notification.error({
									title: error.title,
									message: error.message
								});
							});
					});
				};

				// Leave the edit view
				ppp.close = () => {
					$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
				};

				// Delete a proposal
				ppp.delete = () => {
					const confirmMessage = 'Are you sure you want to delete your proposal? All your work will be lost.';
					ask.yesNo(confirmMessage).then(choice => {
						if (choice) {
							ppp.proposal.$remove(
								() => {
									Notification.success({
										message: '<i class="fas fa-trash"></i> Proposal Deleted'
									});
									ppp.form.proposalform.$setPristine();
									$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
								},
								error => {
									Notification.error({
										title: 'Error',
										message: '<i class="fas fa-exclamation-triangle"></i> ' + error.data.message
									});
								}
							);
						}
					});
				};

				// Withdraw a submitted proposal
				ppp.withdraw = () => {
					ppp.proposal.status = 'Draft';

					const proposalToSave = angular.copy(ppp.proposal);
					saveProposal(proposalToSave)
						.then(response => {
							ppp.proposal = response.savedProposal;
							Notification.success({
								title: 'Success',
								message: '<i class="fas fa-check-circle"></i> Proposal Withdrawn'
							});
						})
						.catch(error => {
							Notification.error({
								title: error.title,
								message: error.message
							});
						});
				};

				// Submit the proposal
				ppp.submit = () => {
					const userToSave = angular.copy(Authentication.user);
					const proposalToSave = angular.copy(ppp.proposal);
					saveUser(userToSave).then(() => {
						OpportunitiesService.getDeadlineStatus({ opportunityId: ppp.opportunity._id }).$promise.then(response => {
							if (response.deadlineStatus === 'CLOSED') {
								Notification.error({
									title: 'Error',
									message: 'The opportunity deadline has passed'
								});
							} else {
								copyUserInfo(proposalToSave);
								proposalToSave.status = 'Submitted';
								saveProposal(proposalToSave).then(
									updatedProposal => {
										ppp.proposal = updatedProposal;
										ppp.form.proposalform.$setPristine();
										Notification.success({
											title: 'Success',
											message: '<i class="fas fa-check-circle"></i>Your proposal has been submitted'
										});
										$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
									},
									error => {
										Notification.error({
											title: 'Error',
											message: '<i class="fas fa-exclamation-triangle"></i> Error Submitting Proposal: ' + error.data.message
										});
									}
								);
							}
						});
					});
				};

				// Upload documents as attachments to proposal
				ppp.upload = file => {
					if (!file) {
						return;
					}

					if (file.size > 3 * 1024 * 1024) {
						Notification.error({
							delay: 6000,
							title: '<div class="text-center"><i class="fas fa-exclamation-triangle"></i> File Too Large</div>',
							message: '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
						});
					} else {
						Upload.upload({
							url: '/api/proposals/' + ppp.proposal._id + '/documents',
							data: {
								file
							}
						}).then(
							response => {
								ppp.proposal = new ProposalsService(response.data);
								Notification.success({ message: '<i class="fas fa-check-circle"></i> Attachment Uploaded' });
							},
							response => {
								Notification.error({ message: response.data, title: '<i class="fas fa-exclamation-triangle"></i> Error Uploading Attachment' });
							},
							evt => {
								ppp.progress = (100.0 * evt.loaded) / evt.total;
							}
						);
					}
				};

				// Delete an attachment from a proposal
				ppp.deleteAttachment = fileId => {
					ProposalsService.removeDoc({
						proposalId: ppp.proposal._id,
						documentId: fileId
					}).$promise.then(doc => {
						ppp.proposal = doc;
					});
				};

				// Get a font-awesome icon name for the given file type
				ppp.getIconName = type => {
					if (type.indexOf('pdf') > -1) {
						return 'fa-file-pdf';
					} else if (type.indexOf('image') > -1) {
						return 'fa-file-image';
					} else if (type.indexOf('word') > -1) {
						return 'fa-file-word';
					} else if (type.indexOf('excel') > -1 || type.indexOf('sheet') > -1) {
						return 'fa-file-excel';
					} else if (type.indexOf('powerpoint') > -1) {
						return 'fa-file-powerpoint';
					} else {
						return 'fa-file';
					}
				};
			}
		]);
})();
