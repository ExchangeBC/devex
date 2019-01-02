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
					proposal: '=',
					org: '='
				},
				controller: [
					'$scope',
					'authenticationService',
					function($scope, authenticationService) {
						const qaz = this;
						qaz.opportunity = $scope.opportunity;
						qaz.proposal = $scope.proposal;
						qaz.org = $scope.org;

						const isUser = authenticationService.user;
						const isAdmin = isUser && authenticationService.user.roles.indexOf('admin') !== -1;
						const isGov = isUser && authenticationService.user.roles.indexOf('gov') !== -1;
						const isMemberOrWaiting = isUser && (qaz.opportunity.userIs.member || qaz.opportunity.userIs.request);
						const isProposal = qaz.proposal && qaz.proposal._id;
						const canedit = !(isAdmin || isGov || isMemberOrWaiting);
						qaz.isSprintWithUs = qaz.opportunity.opportunityTypeCd === 'sprint-with-us';
						const canApply = qaz.org && qaz.org.metRFQ;
						qaz.case = 'nothing';
						if (!isUser) {
							qaz.case = 'guest';
						} else if (canedit) {
							if (isProposal) {
								qaz.case = 'canedit';
							} else if (!qaz.isSprintWithUs) {
								qaz.case = 'canadd';
							} else if (canApply) {
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
