(function () {
	'use strict';

	angular	.module('messages')
	// -------------------------------------------------------------------------
	//
	// service for database interaction - the $resource for messages
	//
	// -------------------------------------------------------------------------
	.factory('MessagesService', ['$resource', '$log', function ($resource, $log) {
		var Payload = $resource('/api/messages/:messageId', {
			messageId: '@_id'
		}, {
			update: {method: 'PUT'},
			my: {
				method: 'GET',
				url: '/api/my/messages',
				isArray: true
			},
			myarchived: {
				method: 'GET',
				url: '/api/my/archivedmessages',
				isArray: true
			},
			mycount: {
				method: 'GET',
				url: '/api/my/messages/count',
				isArray: false
			},
			myarchivedcount: {
				method: 'GET',
				url: '/api/my/archivedmessages/count',
				isArray: false
			},
			getarchived: {
				method: 'GET',
				url: '/api/archivedmessages/:amessageId',
				isArray: false
			},
			viewed: {
				method: 'GET',
				url: '/api/messages/:messageId/viewed',
				isArray: false
			},
			actioned: {
				method: 'GET',
				url: '/api/messages/:messageId/actioned/:action',
				isArray: false
			}
		});
		angular.extend (Payload.prototype, {
			createOrUpdate: function () {
				var message = this;
				if (message._id) {
					return message.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return message.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Payload;
	}])
	// -------------------------------------------------------------------------
	//
	// service for database interaction - the $resource for messages
	//
	// -------------------------------------------------------------------------
	.factory('MessageTemplatesService', ['$resource', '$log', function ($resource, $log) {
		var Payload = $resource('/api/messagetemplates/:templateId', {
			templateId: '@_id'
		}, {update: {method: 'PUT'}});
		angular.extend (Payload.prototype, {
			createOrUpdate: function () {
				var messagetemplate = this;
				if (messagetemplate._id) {
					return messagetemplate.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return messagetemplate.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Payload;
	}])
	;
}());
