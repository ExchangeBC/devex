'use strict';

import angular from 'angular';

(() => {
	const formatDate = d => {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = d.getDate();
		const monthIndex = d.getMonth();
		const year = d.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', ' + year;
	};

	angular
		.module('proposals')

		// Controller the view of the proposal page
		.controller('ProposalSWUViewController', [
			'capabilities',
			'$sce',
			'$state',
			'proposal',
			'ProposalsService',
			'Notification',
			'ask',
			function(capabilities, $sce, $state, proposal, ProposalsService, Notification, ask) {
				const ppp = this;
				ppp.proposal = proposal;
				ppp.user = ppp.proposal.user;
				ppp.opportunity = ppp.proposal.opportunity;
				ppp.detail = $sce.trustAsHtml(ppp.proposal.detail);
				ppp.capabilities = capabilities;
				//
				// what type of opportunity is this? this will determine what tabs get shown
				//
				ppp.isSprintWithUs = true;
				ppp.p_imp = ppp.proposal.phases.implementation;
				ppp.p_inp = ppp.proposal.phases.inception;
				ppp.p_prp = ppp.proposal.phases.proto;
				ppp.p_agg = ppp.proposal.phases.aggregate;
				ppp.oimp = ppp.opportunity.phases.implementation;
				ppp.oinp = ppp.opportunity.phases.inception;
				ppp.oprp = ppp.opportunity.phases.proto;
				ppp.oagg = ppp.opportunity.phases.aggregate;
				ppp.oimp.f_endDate = formatDate(new Date(ppp.oimp.endDate));
				ppp.oimp.f_startDate = formatDate(new Date(ppp.oimp.startDate));
				ppp.oinp.f_endDate = formatDate(new Date(ppp.oinp.endDate));
				ppp.oinp.f_startDate = formatDate(new Date(ppp.oinp.startDate));
				ppp.oprp.f_endDate = formatDate(new Date(ppp.oprp.endDate));
				ppp.oprp.f_startDate = formatDate(new Date(ppp.oprp.startDate));
				// -------------------------------------------------------------------------
				//
				// close the window
				//
				// -------------------------------------------------------------------------
				ppp.close = () => {
					if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
						$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
					} else {
						$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
					}
				};
				ppp.type = type => {
					if (type.indexOf('pdf') > -1) {
						return 'pdf';
					} else if (type.indexOf('image') > -1) {
						return 'image';
					} else if (type.indexOf('word') > -1) {
						return 'word';
					} else if (type.indexOf('excel') > -1) {
						return 'excel';
					} else if (type.indexOf('powerpoint') > -1) {
						return 'powerpoint';
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
							ProposalsService.assign(ppp.proposal).$promise.then(
								response => {
									ppp.proposal = response;
									Notification.success({
										message: '<i class="fas fa-3x fa-check-circle"></i> Company Assigned'
									});
									if (ppp.opportunity.opportunityTypeCd === 'sprint-with-us') {
										$state.go('opportunities.viewswu', { opportunityId: ppp.opportunity.code });
									} else {
										$state.go('opportunities.viewcwu', { opportunityId: ppp.opportunity.code });
									}
								},
								error => {
									Notification.error({
										message: error.data.message,
										title: '<i class="fas fa-3x fa-exclamation-triangle"></i> Error - Assignment failed!'
									});
								}
							);
						}
					});
				};
			}
		]);
})();
