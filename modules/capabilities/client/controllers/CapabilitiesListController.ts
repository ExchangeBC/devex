'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities')
		// Controller for the master list of capabilities
		.controller('CapabilitiesListController', [
			'capabilities',
			'Authentication',
			function(capabilities, Authentication) {
				const vm = this;
				vm.capabilities = capabilities;
				vm.auth = Authentication.permissions();
			}
		]);
})();
