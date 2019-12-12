'use strict';

import { Ng1StateDeclaration, StateParams, StateProvider } from '@uirouter/angularjs';
import angular from 'angular';
import { ICapabilitiesService } from '../../../capabilities/client/services/CapabilitiesService';
import { IOrgService } from '../services/OrgService';

class OrgClientRouter {
	constructor(private $stateProvider: StateProvider) {
		this.init();
	}

	private init(): void {
		this.$stateProvider.state('orgs', this.rootState());
		this.$stateProvider.state('orgs.create', this.createState());
		this.$stateProvider.state('orgs.list', this.listState());
		this.$stateProvider.state('orgs.view', this.viewOrgState());
	}

	private rootState(): Ng1StateDeclaration {
		return {
			abstract: true,
			url: '/orgs',
			template: '<ui-view autoscroll="true"></ui-view>'
		};
	}

	private createState(): Ng1StateDeclaration {
		return {
			url: '/create',
			templateUrl: '/modules/orgs/client/views/org-add.html',
			controller: 'OrgCreateController',
			controllerAs: 'vm',
			resolve: {
				org: [
					'OrgService',
					(OrgService: IOrgService) => {
						return new OrgService();
					}
				]
			}
		};
	}

	private listState(): Ng1StateDeclaration {
		return {
			url: '',
			templateUrl: '/modules/orgs/client/views/list-orgs.client.view.html',
			data: {
				pageTitle: 'Orgs List'
			},
			ncyBreadcrumb: {
				label: 'All orgs'
			},
			resolve: {
				orgs: [
					'OrgService',
					(OrgService: IOrgService) => {
						return OrgService.filter({pageNumber: 1, searchTerm: '', itemsPerPage: 8}).$promise;
					}
				]
			},
			controller: 'OrgsListController',
			controllerAs: 'vm'
		};
	}

	private viewOrgState(): Ng1StateDeclaration {
		return {
			url: '/:orgId',
			templateUrl: '/modules/orgs/client/views/org-view.html',
			controller: 'OrgViewController',
			controllerAs: 'vm',
			resolve: {
				org: [
					'$stateParams',
					'OrgService',
					($stateParams: StateParams, OrgService: IOrgService) => {
						return OrgService.get({
							orgId: $stateParams.orgId
						}).$promise;
					}
				],
				capabilities: [
					'CapabilitiesService',
					(CapabilitiesService: ICapabilitiesService) => {
						return CapabilitiesService.query().$promise;
					}
				]
			},
			data: {
				roles: ['user', 'admin']
			}
		};
	}
}

angular.module('orgs.routes').config(['$stateProvider', ($stateProvider: StateProvider) => new OrgClientRouter($stateProvider)]);
