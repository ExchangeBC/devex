import angular from 'angular';

(window => {
	'use strict';

	const applicationModuleName = 'mean';

	const service = {
		applicationEnvironment: window.env,
		applicationModuleName,
		applicationModuleVendorDependencies: [
			'ngAnimate',
			'ngResource',
			'ngMessages',
			'ui.router',
			'ui.bootstrap',
			'ui.tinymce',
			'ngFileUpload',
			'ui-notification',
			'ncy-angular-breadcrumb',
			'dndLists',
			'ngIdle',
			'ngSanitize',
			'ui.bootstrap',
			'ng-currency',
			'uiCropper'
		],
		registerModule
	};

	window.ApplicationConfiguration = service;

	// Add a new vertical module
	function registerModule(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	}

	// Angular-ui-notification configuration
	angular.module('ui-notification').config([
		'NotificationProvider',
		NotificationProvider => {
			NotificationProvider.setOptions({
				delay: 2000,
				horizontalSpacing: 10,
				positionX: 'right',
				positionY: 'top',
				startRight: 10,
				startTop: 10,
				verticalSpacing: 10,
				replaceMessage: false,
				templateUrl: 'angular-ui-notification.html'
			});
		}
	]);

	// Angular idle configuration
	angular.module('ngIdle').config([
		'IdleProvider',
		'KeepaliveProvider',
		(IdleProvider, KeepaliveProvider) => {
			IdleProvider.idle(Number((window as any).sessionTimeoutWarning));
			IdleProvider.timeout(Number((window as any).sessionTimeout));
			KeepaliveProvider.interval(2);
		}
	]);
})(window);
