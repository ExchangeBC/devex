'use strict';

import angular from 'angular';

(() => {
	angular
		.module('proposals')

		// directive for the button to apply, edit, or review proposal
		.directive('proposalApply', () => {
			return {
				restrict: 'E',
				controllerAs: 'qaz',
				templateUrl: '/modules/proposals/client/views/proposal-apply.directive.html',
				scope: {
					opportunity: '=',
					proposal: '='
				},
				controller: [
					'$scope',
					'Authentication',
					function($scope, Authentication) {
						const qaz = this;
						qaz.opportunity = $scope.opportunity;
						qaz.proposal = $scope.proposal;

						const isUser = Authentication.user;
						const isAdmin = isUser && Authentication.user.roles.indexOf('admin') !== -1;
						const isGov = isUser && Authentication.user.roles.indexOf('gov') !== -1;
						const isMemberOrWaiting = isUser && (qaz.opportunity.userIs.member || qaz.opportunity.userIs.request);
						const isProposal = qaz.proposal && qaz.proposal._id;
						const canedit = !(isAdmin || isGov || isMemberOrWaiting);
						qaz.isSprintWithUs = qaz.opportunity.opportunityTypeCd === 'sprint-with-us';
						let hasCompany = isUser && Authentication.user.orgsAdmin.length > 0;
						hasCompany = qaz.opportunity.hasOrg;
						qaz.case = 'nothing';
						if (!isUser) {
							qaz.case = 'guest';
						} else if (canedit) {
							if (isProposal) {
								qaz.case = 'canedit';
							} else if (!qaz.isSprintWithUs) {
								qaz.case = 'canadd';
							} else if (hasCompany) {
								qaz.case = 'canadd';
							} else {
								qaz.case = 'needscompany';
							}
						}
					}
				]
			};
		});
})();
