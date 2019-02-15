'use strict';

import { Ng1StateDeclaration, StateParams, StateProvider, StateService, UrlRouterProvider } from '@uirouter/angularjs';
import angular, { auto } from 'angular';

class CoreClientRouter {
	public static $inject = ['$stateProvider', '$urlRouterProvider'];

	private homeState: Ng1StateDeclaration = {
		url: '/',
		templateUrl: '/modules/core/client/views/home.client.view.html',
		controller: 'HomeController',
		controllerAs: 'vm',
		ncyBreadcrumb: {
			label: 'Home'
		}
	};

	private notFoundState: Ng1StateDeclaration = {
		url: '/not-found',
		templateUrl: '/modules/core/client/views/404.client.view.html',
		controller: 'ErrorController',
		controllerAs: 'vm',
		params: {
			message: [
				'$stateParams',
				($stateParams: StateParams) => {
					return $stateParams.message;
				}
			]
		},
		data: {
			ignoreState: true,
			pageTitle: 'Not Found'
		},
		ncyBreadcrumb: {
			label: 'Not Found'
		}
	};

	private badRequestState: Ng1StateDeclaration = {
		url: '/not-found',
		templateUrl: '/modules/core/client/views/404.client.view.html',
		controller: 'ErrorController',
		controllerAs: 'vm',
		params: {
			message: [
				'$stateParams',
				($stateParams: StateParams) => {
					return $stateParams.message;
				}
			]
		},
		data: {
			ignoreState: true,
			pageTitle: 'Not Found'
		},
		ncyBreadcrumb: {
			label: 'Not Found'
		}
	};

	private forbiddenState: Ng1StateDeclaration = {
		url: '/forbidden',
		templateUrl: '/modules/core/client/views/403.client.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Forbidden'
		}
	};

	private disclaimerState: Ng1StateDeclaration = {
		url: '/disclaimer',
		templateUrl: '/modules/core/client/views/disclaimer.client.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Disclaimer'
		}
	};

	private privacyState: Ng1StateDeclaration = {
		url: '/privacy',
		templateUrl: '/modules/core/client/views/privacy.client.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Privacy'
		}
	};

	private accessibilityState: Ng1StateDeclaration = {
		url: '/accessibility',
		templateUrl: '/modules/core/client/views/accessibility.client.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Accessibility'
		}
	};

	private codeWithUsState: Ng1StateDeclaration = {
		url: '/codewithus',
		templateUrl: '/modules/core/client/views/codewithus.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Code With Us'
		}
	};

	private codeWithUsPsState: Ng1StateDeclaration = {
		url: '/codewithusps',
		templateUrl: '/modules/core/client/views/codewithus-ps.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Code With Us'
		}
	};

	private sprintWithUs: Ng1StateDeclaration = {
		url: '/sprintwithus',
		templateUrl: '/modules/core/client/views/sprintwithus.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Sprint With Us'
		}
	};

	private aboutState: Ng1StateDeclaration = {
		url: '/about',
		templateUrl: '/modules/core/client/views/about.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'About Us'
		}
	};

	private copyrightState: Ng1StateDeclaration = {
		url: '/copyright',
		templateUrl: '/modules/core/client/views/copyright.client.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'Copyright'
		}
	};

	private templateState: Ng1StateDeclaration = {
		url: '/template/:templateId',
		templateUrl: ($stateParams: StateParams) => {
			const id = $stateParams.templateId;
			return `/modules/core/client/views/templates/template-${id}.html`;
		},
		data: {
			ignoreState: true,
			pageTitle: 'Template'
		}
	};

	private sprintWithUsHowToApplyState: Ng1StateDeclaration = {
		url: '/sprintwithus-howtoapply',
		templateUrl: '/modules/core/client/views/sprintwithus-howtoapply.view.html',
		data: {
			ignoreState: true,
			pageTitle: 'How to Apply'
		}
	};

	// private techSummitState: Ng1StateDeclaration = {
	// 	url: '/bctechsummit',
	// 	templateUrl: '/modules/core/client/views/tech.summit.html',
	// 	controller: 'TechSummitController',
	// 	controllerAs: '$ctrl',
	// 	data: {
	// 		ignoreState: true,
	// 		pageTitle: 'BC Tech Summit'
	// 	}
	// };

	constructor(private $stateProvider: StateProvider, private $urlRouterProvider: UrlRouterProvider) {
		this.init();
	}

	private init(): void {
		// Set up route handling
		this.$urlRouterProvider.otherwise(this.urlRouteNotFoundHandler);

		// Set up core routes
		this.$stateProvider.state('home', this.homeState);
		this.$stateProvider.state('not-found', this.notFoundState);
		this.$stateProvider.state('bad-request', this.badRequestState);
		this.$stateProvider.state('forbidden', this.forbiddenState);
		this.$stateProvider.state('disclaimer', this.disclaimerState);
		this.$stateProvider.state('privacy', this.privacyState);
		this.$stateProvider.state('accessibility', this.accessibilityState);
		this.$stateProvider.state('codewithus', this.codeWithUsState);
		this.$stateProvider.state('codewithusps', this.codeWithUsPsState);
		this.$stateProvider.state('sprintwithus', this.sprintWithUs);
		this.$stateProvider.state('about', this.aboutState);
		this.$stateProvider.state('copyright', this.copyrightState);
		this.$stateProvider.state('template', this.templateState);
		this.$stateProvider.state('sprintwithus-howtoapply', this.sprintWithUsHowToApplyState);
		// this.$stateProvider.state('bctechsummit', this.techSummitState);
	}

	private urlRouteNotFoundHandler($injector: auto.IInjectorService): void {
		const $state: StateService = $injector.get('$state');
		$state.transitionTo('not-found', null, {
			location: false
		});
	}
}

angular
	.module('opportunities.routes')
	.config(['$stateProvider', '$urlRouterProvider', ($stateProvider: StateProvider, $urlRouterProvider: UrlRouterProvider) => new CoreClientRouter($stateProvider, $urlRouterProvider)]);
