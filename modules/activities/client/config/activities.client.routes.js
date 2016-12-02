// =========================================================================
//
// All the client side routes for activities
//
// =========================================================================
(function () {
	'use strict';

	angular.module('activities.routes').config(['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all activity routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state('activities', {
			abstract: true,
			url: '/activities',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// activity listing. Resolve to all activities in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state('activities.list', {
			url: '',
			templateUrl: '/modules/activities/client/views/list-activities.client.view.html',
			data: {
				pageTitle: 'Activities List'
			},
			resolve: {
				activities: function ($stateParams, ActivitiesService) {
					return ActivitiesService.query ();
				}
			},
			controller: 'ActivitiesListController',
			controllerAs: 'vm'
		})
		// -------------------------------------------------------------------------
		//
		// view a activity, resolve the activity data
		//
		// -------------------------------------------------------------------------
		.state('activities.view', {
			url: '/:activityId',
			templateUrl: '/modules/activities/client/views/view-activity.client.view.html',
			controller: 'ActivityViewController',
			controllerAs: 'vm',
			resolve: {
				activity: function ($stateParams, ActivitiesService) {
					return ActivitiesService.get({
						activityId: $stateParams.activityId
					}).$promise;
				}
			},
			data: {
				pageTitle: 'Activity {{ activityResolve.title }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state('activityadmin', {
			abstract: true,
			url: '/activityadmin',
			template: '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a activity
		//
		// -------------------------------------------------------------------------
		.state('activityadmin.edit', {
			url: '/:activityId/edit',
			templateUrl: '/modules/activities/client/views/edit-activity.client.view.html',
			controller: 'ActivityEditController',
			controllerAs: 'vm',
			resolve: {
				activity: function ($stateParams, ActivitiesService) {
					return ActivitiesService.get({
						activityId: $stateParams.activityId
					}).$promise;
				},
				editing: function () { return true; }
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Activity {{ activity.title }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new activity and edit it
		//
		// -------------------------------------------------------------------------
		.state('activityadmin.create', {
			url: '/create',
			templateUrl: '/modules/activities/client/views/edit-activity.client.view.html',
			controller: 'ActivityEditController',
			controllerAs: 'vm',
			resolve: {
				activity: function (ActivitiesService) {
					return new ActivitiesService();
				},
				editing: function () { return false; }
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Activity'
			}
		})
		;
	}]);
}());
