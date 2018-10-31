/**
 * OpportunityApprovalController: Controller for SWU opportunity approval
 * Author: Andrew Sutherland (andrew.L.sutherland@gov.bc.ca)
 */
(function() {
	'use strict';
	angular.module('opportunities').controller('OpportunityApprovalController', [
		'$state',
		'Notification',
		'opportunity',
		'ask',
		function($state, Notification, opportunity, ask) {
			var vm = this;
			vm.opportunity = opportunity;

			/**
			 * Saves the opportunity with input approval info.
			 */
			vm.save = function() {
				vm.opportunity
					.createOrUpdate()
					.then(function(savedOpportunity) {
						vm.opportunity = savedOpportunity;
						Notification.success({
							message: '<i class="fas fa-check-circle"></i> Approval information saved',
							title: 'Success'
						});
					})
					.catch(function(res) {
						Notification.error({
							message: '<i class="fas fa-exclamation-triangle"></i> Error: ' + res.message,
							title: 'Error'
						});
					});
			};

			/**
			 * Mark intermediate approval action as 'to-send' and save.
			 * The server will start the approval sequence by sending a request email to the intermediate approval.
			 */
			vm.sendRequest = function(isValid) {
				if (!isValid) {
					Notification.error({
						message: '<i class="fas fa-exclamation-triangle"></i> Please fill out all required fields.',
						title: 'Error'
					});
				}

				var confirmMessage = 'Are you sure you are ready to send the requests with the entered contact information?';
				ask.yesNo(confirmMessage).then(function(choice) {
					if (choice) {
						vm.opportunity.intermediateApproval.action = 'to-send';
						vm.opportunity
							.createOrUpdate()
							.then(function(savedOpportunity) {
								vm.opportunity = savedOpportunity;
								Notification.success({
									message: '<i class="fas fa-check-circle"></i> Approval request sent!',
									title: 'Success'
								});
								$state.go('opportunities.viewswu', { opportunityId: vm.opportunity.code });
							})
							.catch(function(res) {
								Notification.error({
									message: '<i class="fas fa-exclamation-triangle"></i> Error: ' + res.message,
									title: 'Error'
								});
							});
					}
				});
			};
		}
	]);
}());
