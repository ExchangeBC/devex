// =========================================================================
//
// All the client side routes for profiles
//
// =========================================================================
(function () {
	'use strict';

	angular.module('profiles.routes').config(['$stateProvider', function ($stateProvider) {
		if (window.features.swu) $stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all profile routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('profiles', {
			abstract: true,
			url: '/profiles',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// profile listing. Resolve to all profiles in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('profiles.list', {
			url: '',
			templateUrl: '/modules/profiles/client/views/list-profiles.client.view.html',
			data: {
				pageTitle: 'Profiles List'
			},
			ncyBreadcrumb: {
				label: 'All profiles'
			},
			resolve: {
				profiles: function ($stateParams, ProfilesService) {
					return ProfilesService.query ();
				}
			},
			controller: 'ProfilesListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a profile, resolve the profile data
		//
		// -------------------------------------------------------------------------
		.state('profiles.view', {
			url: '/:profileId',
			templateUrl: '/modules/profiles/client/views/view-profile.client.view.html',
			controller: 'ProfileViewController',
			controllerAs: 'vm',
			resolve: {
				profile: function ($stateParams, ProfilesService) {
					return ProfilesService.get({
						profileId: $stateParams.profileId
					}).$promise;
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('profileadmin', {
			abstract: true,
			url: '/profileadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a profile
		//
		// -------------------------------------------------------------------------
		.state('profileadmin.edit', {
			url: '/:profileId/edit',
			templateUrl: '/modules/profiles/client/views/edit-profile.client.view.html',
			controller: 'ProfileEditController',
			controllerAs: 'vm',
			resolve: {
				profile: function ($stateParams, ProfilesService) {
					return ProfilesService.get({
						profileId: $stateParams.profileId
					}).$promise;
				},
				editing: function () { return true; },
				previousState: function ($state) {
					return {
						name: $state.current.name,
						params: $state.params,
						url: $state.href($state.current.name, $state.params)
					};
				}
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new profile and edit it
		//
		// -------------------------------------------------------------------------
		.state('profileadmin.create', {
			url: '/create',
			templateUrl: '/modules/profiles/client/views/edit-profile.client.view.html',
			controller: 'ProfileEditController',
			controllerAs: 'vm',
			resolve: {
				profile: function (ProfilesService) {
					return new ProfilesService();
				},
				editing: function () { return false; },
				previousState: function ($state) {
				  return {
					name: $state.current.name,
					params: $state.params,
					url: $state.href($state.current.name, $state.params)
				  };
				}
			}
		})
		;
	}]);
}());
