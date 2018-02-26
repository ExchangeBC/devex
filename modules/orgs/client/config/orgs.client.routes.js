// =========================================================================
//
// All the client side routes for orgs
//
// =========================================================================
(function () {
	'use strict';

	if (window.features.swu) angular.module('orgs.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all org routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('orgs', {
			abstract: true,
			url: '/orgs',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// create a new org
		//
		// -------------------------------------------------------------------------
		.state ('orgs.create', {
			url: '/create',
			templateUrl: '/modules/orgs/client/views/org-add.html',
			controller: 'OrgCreateController',
			controllerAs: 'vm',
			resolve: {
				org: function (OrgsService) {
					return new OrgsService();
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// org listing. Resolve to all orgs in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('orgs.list', {
			url: '',
			templateUrl: '/modules/orgs/client/views/list-orgs.client.view.html',
			data: {
				pageTitle: 'Orgs List'
			},
			ncyBreadcrumb: {
				label: 'All orgs'
			},
			resolve: {
				orgs: function ($stateParams, OrgsService) {
					return OrgsService.query ().$promise;
				}
			},
			controller: 'OrgsListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a org, resolve the org data
		//
		// -------------------------------------------------------------------------
		.state('orgs.view', {
			url: '/:orgId',
			templateUrl: '/modules/orgs/client/views/org-view.html',
			controller: 'OrgViewController',
			controllerAs: 'vm',
			resolve: {
				org: function ($stateParams, OrgsService) {
					return OrgsService.get({
						orgId: $stateParams.orgId
					}).$promise;
				},
				capabilities: function (SkillsService) {
					return SkillsService.list ().$promise;
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('orgadmin', {
			abstract: true,
			url: '/orgadmin/:orgId',
			templateUrl: '/modules/orgs/client/views/org-edit.html',
			controller: 'OrgAdminController',
			controllerAs: 'vm',
			resolve: {
				org: function ($stateParams, OrgsService) {
					return OrgsService.get({
						orgId: $stateParams.orgId
					}).$promise;
				},
				capabilities: function (SkillsService) {
					return SkillsService.list ().$promise;
				}
			},
			data: {
				roles: ['user', 'admin']
			}
		})
		.state('orgadmin.profile', {
			url: '/main',
			templateUrl: '/modules/orgs/client/views/org-main.html',
			controller: 'OrgProfileController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Company Settings'
			},
			resolve: {
				capabilities: function (SkillsService) {
					return SkillsService.query ().$promise;
				}
			}
		})
		.state ('orgadmin.skills', {
			url: '/skills',
			templateUrl: '/modules/orgs/client/views/org-skills.html',
			controller: 'OrgSkillsController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Company Skills'
			},
			resolve: {
				capabilities: function (SkillsService) {
					return SkillsService.list ().$promise;
				}
			}
		})
		.state ('orgadmin.members', {
			url: '/members',
			templateUrl: '/modules/orgs/client/views/org-members.html',
			controller: 'OrgMembersController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Company Members'
			}
		})
		.state ('orgadmin.teams', {
			url: '/teams',
			templateUrl: '/modules/orgs/client/views/org-teams.html',
			controller: 'OrgTeamsController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Company Teams'
			}
		})
		.state ('orgadmin.proposals', {
			url: '/proposals',
			templateUrl: '/modules/orgs/client/views/org-proposals.html',
			controller: 'OrgProposalsController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Company Proposals'
			}
		})
		// // -------------------------------------------------------------------------
		// //
		// // edit a org
		// //
		// // -------------------------------------------------------------------------
		// .state('orgadmin.profile', {
		// 	url: '/:orgId/edit',
		// 	templateUrl: '/modules/orgs/client/views/edit-org.client.view.html',
		// 	controller: 'OrgEditController',
		// 	controllerAs: 'vm',
		// 	resolve: {
		// 		org: function ($stateParams, OrgsService) {
		// 			return OrgsService.get({
		// 				orgId: $stateParams.orgId
		// 			}).$promise;
		// 		},
		// 		editing: function () { return true; },
		// 		previousState: function ($state) {
		// 			return {
		// 				name: $state.current.name,
		// 				params: $state.params,
		// 				url: $state.href($state.current.name, $state.params)
		// 			};
		// 		}
		// 	}
		// })
		;
	}]);
}());
