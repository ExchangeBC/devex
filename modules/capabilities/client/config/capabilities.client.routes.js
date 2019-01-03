// =========================================================================
//
// All the client side routes for capabilities
//
// =========================================================================
(function () {
	'use strict';
	angular.module ('capabilities.routes').config (['$stateProvider', function ($stateProvider) {
		$stateProvider
		// -------------------------------------------------------------------------
		//
		// this is the top level, abstract route for all capability routes, it only
		// contians the ui-view that all other routes get rendered in
		//
		// -------------------------------------------------------------------------
		.state ('capabilities', {
			abstract : true,
			url      : '/capabilities',
			template : '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// capability listing. Resolve to all capabilities in the system and place that in
		// the scope. listing itself is done through a directive
		//
		// -------------------------------------------------------------------------
		.state ('capabilities.list', {
			url          : '',
			templateUrl  : '/modules/capabilities/client/views/list-capabilities.client.view.html',
			controller   : 'CapabilitiesListController',
			controllerAs : 'vm',
			resolve: {
				capabilities: ['CapabilitiesService', function (CapabilitiesService) {
					return CapabilitiesService.query ().$promise;
				}]
			},
			data: {
				pageTitle: 'Capabilities List'
			}
		})
		// -------------------------------------------------------------------------
		//
		// view a capability, resolve the capability data
		//
		// -------------------------------------------------------------------------
		.state ('capabilities.view', {
			url          : '/:capabilityId',
			templateUrl  : '/modules/capabilities/client/views/view-capability.client.view.html',
			controller   : 'CapabilityViewController',
			controllerAs : 'vm',
			resolve: {
				capability: ['$stateParams', 'CapabilitiesService', function ($stateParams, CapabilitiesService) {
					return CapabilitiesService.get ({
						capabilityId: $stateParams.capabilityId
					}).$promise;
				}]
			},
			data: {
				pageTitle: 'Capability: {{ capability.name }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state ('capabilityadmin', {
			abstract : true,
			url      : '/capabilityadmin',
			template : '<ui-view autoscroll="true"></ui-view>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a capability
		//
		// -------------------------------------------------------------------------
		.state ('capabilityadmin.edit', {
			url          : '/:capabilityId/edit',
			templateUrl  : '/modules/capabilities/client/views/edit-capability.client.view.html',
			controller   : 'CapabilityEditController',
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return true; },
				capability: ['$stateParams', 'CapabilitiesService', function ($stateParams, CapabilitiesService) {
					return CapabilitiesService.get ({
						capabilityId: $stateParams.capabilityId
					}).$promise;
				}]
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Capability {{ capability.title }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new capability and edit it
		//
		// -------------------------------------------------------------------------
		.state ('capabilityadmin.create', {
			url          : '/create',
			templateUrl  : '/modules/capabilities/client/views/edit-capability.client.view.html',
			controller   : 'CapabilityEditController',
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return false; },
				capability: ['CapabilitiesService', function (CapabilitiesService) {
					return new CapabilitiesService();
				}]
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Capability'
			}
		})
		;
	}]);
}());


