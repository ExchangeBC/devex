'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities')
		// Controller the view of the capability page
		.controller('CapabilityViewController', [
			'$sce',
			'capability',
			'authenticationService',
			function($sce, capability, authenticationService) {
				const vm = this;
				vm.trust = $sce.trustAsHtml;
				vm.capability = capability;
				vm.auth = authenticationService.permissions();
				vm.canEdit = vm.auth.isAdmin;
			}
		]);
})();
