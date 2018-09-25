// =========================================================================
//
// All the client side routes for opportunities
//
// =========================================================================
(function () {
	'use strict';

	angular.module ('messages.routes').config (['$stateProvider', function ($stateProvider) {
		$stateProvider
		.state ('messagetemplates', {
			abstract : true,
			url      : '/messagetemplates',
			template : '<ui-view autoscroll="true"></ui-view>'
		})
		.state ('messagetemplates.list', {
			url          : '',
			templateUrl  : '/modules/messages/client/views/message-template-list.html',
			data         : { pageTitle: 'Message Templates List' },
			resolve      : {
				templates: ['MessageTemplatesService', function (MessageTemplatesService) {
					return MessageTemplatesService.query ().$promise;
				}]
			},
			controllerAs : 'vm',
			controller   : 'MessageTemplatesListController'
		})
		.state ('messagetemplates.view', {
			url          : '/:templateId',
			templateUrl  : '/modules/messages/client/views/message-template-view.html',
			data         : { pageTitle: 'Message Templates List' },
			resolve      : {
				template: ['MessageTemplatesService', '$stateParams', function (MessageTemplatesService, $stateParams) {
					return MessageTemplatesService.get ({
						templateId: $stateParams.templateId
					}).$promise;
				}]
			},
			controllerAs : 'qqq',
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
			template : '<ui-view autoscroll="true"></ui-view>'
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
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return true; },
				template: ['$stateParams', 'MessageTemplatesService', function ($stateParams, MessageTemplatesService) {
					return MessageTemplatesService.get ({
						templateId: $stateParams.templateId
					}).$promise;
				}]
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
			controllerAs : 'qqq',
			resolve: {
				editing: function () { return false; },
				template: ['MessageTemplatesService', function (MessageTemplatesService) {
					return new MessageTemplatesService ();
				}]
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Superbasic'
			}
		})
		// -------------------------------------------------------------------------
		//
		// viewing an actual message
		//
		// -------------------------------------------------------------------------
		.state ('messages', {
			abstract : true,
			url      : '/messages',
			template : '<ui-view autoscroll="true"></ui-view>'
		})
		.state ('messages.view', {
			url          : '/:messageId',
			templateUrl  : '/modules/messages/client/views/message-view.html',
			data         : { pageTitle: 'Message View' },
			resolve      : {
				message: ['MessagesService', '$stateParams', function (MessagesService, $stateParams) {
					return MessagesService.get ({
						messageId: $stateParams.messageId
					}).$promise;
				}]
			},
			controllerAs : 'vm',
			controller   : 'MessageViewController'
		})
		;
	}]);
} () );
