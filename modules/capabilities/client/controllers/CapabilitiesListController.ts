'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities')
		// Controller for the master list of capabilities
		.controller('CapabilitiesListController', [
			'capabilities',
			'AuthenticationService',
			function(capabilities, authenticationService) {
				const vm = this;
				vm.capabilities = capabilities;
				vm.auth = authenticationService.permissions();
			}
		]);
})();
