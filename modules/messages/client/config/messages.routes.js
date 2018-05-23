// =========================================================================
//
// All the client side routes for opportunities
//
// =========================================================================
(function () {
	'use strict';

	if (window.features.messages) angular.module ('messages.routes').config (['$stateProvider', function ($stateProvider) {
		$stateProvider
		.state ('messagetemplates', {
			abstract : true,
			url      : '/messagetemplates',
			template : '<ui-view/>'
		})
		.state ('messagetemplates.list', {
			url          : '',
			templateUrl  : '/modules/messages/client/views/message-template-list.html',
			data         : { pageTitle: 'Message Templates List' },
			resolve      : {
				templates: function (MessageTemplatesService) {
					return MessageTemplatesService.query ();
				}
			},
			controllerAs : 'vm',
			controller   : 'MessageTemplatesListController'
		})
		.state ('messagetemplates.view', {
			url          : '/:templateId',
			templateUrl  : '/modules/messages/client/views/message-template-view.html',
			data         : { pageTitle: 'Message Templates List' },
			resolve      : {
				template: function (MessageTemplatesService, $stateParams) {
					return MessageTemplatesService.get ({
						templateId: $stateParams.templateId
					});
				}
			},
			controllerAs : 'vm',
			controller   : 'MessageTemplateViewController'
		})
		// -------------------------------------------------------------------------
		//
		// the base for editing
		//
		// -------------------------------------------------------------------------
		.state ('messagetemplatesadmin', {
			abstract : true,
			url      : '/messagetemplatesadmin',
			template : '<ui-view/>'
		})
		// -------------------------------------------------------------------------
		//
		// edit a template
		//
		// -------------------------------------------------------------------------
		.state ('messagetemplatesadmin.edit', {
			url          : '/:templateId/edit',
			templateUrl  : '/modules/messages/client/views/message-template-edit.html',
			controller   : 'MessageTemplateEditController',
			controllerAs : 'vm',
			resolve: {
				editing: function () { return true; },
				template: function ($stateParams, MessageTemplatesService) {
					return MessageTemplatesService.get ({
						templateId: $stateParams.templateId
					}).$promise;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Superbasic {{ template.title }}'
			}
		})
		// -------------------------------------------------------------------------
		//
		// create a new template and edit it
		//
		// -------------------------------------------------------------------------
		.state ('messagetemplatesadmin.create', {
			url          : '/create',
			templateUrl  : '/modules/messages/client/views/message-template-edit.html',
			controller   : 'MessageTemplateEditController',
			controllerAs : 'vm',
			resolve: {
				editing: function () { return false; },
				template: function (MessageTemplatesService) {
					return new MessageTemplatesService ();
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Superbasic'
			}
		})
		;
	}]);
} () );
