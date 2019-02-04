'use strict';

import { Ng1StateDeclaration, StateProvider } from '@uirouter/angularjs';
import angular from 'angular';

class CoreClientAdminRouter {
	public static $inject = ['$stateProvider'];

	constructor(private $stateProvider: StateProvider) {
		this.init();
	}

	private init(): void {
		this.$stateProvider.state('admin', this.rootState());
	}

	private rootState(): Ng1StateDeclaration {
		return {
			abstract: true,
			url: '/admin',
			template: '<ui-view autoscroll="true"/>',
			data: {
				roles: ['admin']
			}
		}
	}
}

angular.module('core.admin.routes').config(['$stateProvider', ($stateProvider: StateProvider) => new CoreClientAdminRouter($stateProvider)]);
