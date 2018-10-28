/**
 * OpportunityApprovalController: Controller for SWU opportunity approval
 * Author: Andrew Sutherland (andrew.L.sutherland@gov.bc.ca)
 */
(function() {
	'use strict';
	angular.module('opportunities').controller('OpportunityApprovalController', [
		'$scope',
		'Authentication',
		'Notification',
		'opportunity',
		function($scope, Authentication, Notification, opportunity) {
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
		}
	]);
}());
