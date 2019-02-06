'use strict';

import { UIViewScrollProvider } from '@uirouter/angularjs/lib/viewScroll';
import angular, { ICompileProvider, idle, IHttpProvider, ILocationProvider, ILogProvider, uiNotification } from 'angular';

export interface IApplicationConfiguration {
	applicationEnvironment: string;
	applicationModuleName: string;
	applicationModuleVendorDependencies: string[];

	registerModule(moduleName: string, dependencies: string[]): void;
}

class ApplicationConfiguration implements IApplicationConfiguration {
	public applicationEnvironment = window.env;
	public applicationModuleName = 'mean';
	public applicationModuleVendorDependencies: string[];

	constructor() {
		this.init = this.init.bind(this);
		this.bootstrapConfig = this.bootstrapConfig.bind(this);
		this.applicationModuleVendorDependencies = [
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
		];

		this.bootstrapConfig.$inject = ['$compileProvider', '$locationProvider', '$httpProvider', '$logProvider', '$uiViewScrollProvider'];

		// Configure any third party modules that require it
		this.configureThirdPartyModules();

		// Start by defining the main module and adding the module dependencies
		angular.module(this.applicationModuleName, this.applicationModuleVendorDependencies);

		// Setting HTML5 Location Mode
		angular.module(this.applicationModuleName).config(this.bootstrapConfig);

		// Define the init function for starting up the application
		angular.element(document).ready(this.init);
	}

	public registerModule(moduleName: string, dependencies: string[]): void {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(this.applicationModuleName).requires.push(moduleName);
	}

	private bootstrapConfig(
		$compileProvider: ICompileProvider,
		$locationProvider: ILocationProvider,
		$httpProvider: IHttpProvider,
		$logProvider: ILogProvider,
		$uiViewScrollProvider: UIViewScrollProvider
	) {
		$locationProvider
			.html5Mode({
				enabled: true,
				requireBase: true
			})
			.hashPrefix('!');

		$httpProvider.interceptors.push('authInterceptor');

		// Disable debug data for production environment
		// @link https://docs.angularjs.org/guide/production
		$compileProvider.debugInfoEnabled(this.applicationEnvironment !== 'production');
		$logProvider.debugEnabled(this.applicationEnvironment !== 'production');

		$uiViewScrollProvider.useAnchorScroll();
	}

	private configureThirdPartyModules(): void {
		// Angular-ui-notification configuration
		angular.module('ui-notification').config([
			'NotificationProvider',
			(NotificationProvider: uiNotification.INotificationProvider) => {
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
			(IdleProvider: idle.IIdleProvider, KeepaliveProvider: idle.IKeepAliveProvider) => {
				IdleProvider.idle(Number(window.sessionTimeoutWarning));
				IdleProvider.timeout(Number(window.sessionTimeout));
				KeepaliveProvider.interval(2);
			}
		]);
	}

	private init(): void {
		// Fixing facebook bug with redirect
		if (window.location.hash && window.location.hash === '#_=_' && (window.history && history.pushState)) {
			window.history.pushState('', document.title, window.location.pathname);
		}

		// Then init the app
		angular.bootstrap(document, [this.applicationModuleName]);
	}
}

window.ApplicationConfiguration = new ApplicationConfiguration();
