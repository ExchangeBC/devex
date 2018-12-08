'use strict';

import angular from 'angular';

(() => {
	angular
		.module('proposals')

		// Controller for the master list of programs
		.controller('ProposalsListController', [
			'ProposalsService',
			function(ProposalsService) {
				const ppp = this;
				ppp.proposals = ProposalsService.query();
			}
		]);
})();
