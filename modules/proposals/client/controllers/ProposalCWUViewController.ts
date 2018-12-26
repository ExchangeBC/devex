'use strict';

import angular from 'angular';

(() => {
	angular
		.module('proposals')

		// Controller for the view of the CWU proposal page
		.controller('ProposalCWUViewController', [
			'capabilities',
			'$sce',
			'$state',
			'proposal',
			'ProposalsService',
			'opportunitiesService',
			'Notification',
			'ask',
			function(capabilities, $sce, $state, proposal, ProposalsService, OpportunitiesService, Notification, ask) {

				const ppp = this;
				ppp.proposal = angular.copy(proposal);
				ppp.user = ppp.proposal.user;
				ppp.opportunity = ppp.proposal.opportunity;
				ppp.detail = $sce.trustAsHtml(ppp.proposal.detail);
				ppp.capabilities = capabilities;

				// close the window
				ppp.close = () => {
					if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
						$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
					} else {
						$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
					}
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

				ppp.downloadfile = fileid => {
					ProposalsService.downloadDoc({
						proposalId: ppp.proposal._id,
						documentId: fileid
					});
				};
				ppp.assign = () => {
					const q = 'Are you sure you want to assign this opportunity to this proponent?';
					ask.yesNo(q).then(r => {
						if (r) {
							OpportunitiesService.assign({ opportunityId: ppp.opportunity.code, proposalId: ppp.proposal._id }).$promise.then(
								response => {
									ppp.proposal = response;
									Notification.success({ message: '<i class="fas fa-check-circle"></i> Proposal has been assigned' });
									if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
										$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
									} else {
										$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
									}
								},
								error => {
									Notification.error({ message: error.data.message, title: '<i class="fas fa-exclamation-triangle"></i> Proposal Assignment failed!' });
								}
							);
						}
					});
				};
			}
		]);
})();
