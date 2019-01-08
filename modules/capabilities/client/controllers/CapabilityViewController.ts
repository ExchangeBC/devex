'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities')
		// Controller the view of the capability page
		.controller('CapabilityViewController', [
			'$sce',
			'capability',
			'Authentication',
			function($sce, capability, Authentication) {
				const vm = this;
				vm.trust = $sce.trustAsHtml;
				vm.capability = capability;
				vm.auth = Authentication.permissions();
				vm.canEdit = vm.auth.isAdmin;
			}
		]);
})();
