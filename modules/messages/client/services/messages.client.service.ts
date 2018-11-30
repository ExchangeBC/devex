(() => {
	'use strict';

	angular
		.module('messages')
		// -------------------------------------------------------------------------
		//
		// service for database interaction - the $resource for messages
		//
		// -------------------------------------------------------------------------
		.factory('MessagesService', [
			'$resource',
			'$log',
			($resource, $log) => {
				const Payload = $resource(
					'/api/messages/:messageId',
					{
						messageId: '@_id'
					},
					{
						update: { method: 'PUT' },
						my: {
							method: 'GET',
							url: '/api/messages',
							isArray: true
						},
						myarchived: {
							method: 'GET',
							url: '/api/messages/archived',
							isArray: true
						},
						mycount: {
							method: 'GET',
							url: '/api/messages/count',
							isArray: false
						},
						myarchivedcount: {
							method: 'GET',
							url: '/api/messages/archived/count',
							isArray: false
						},
						getarchived: {
							method: 'GET',
							url: '/api/messages/:archivedMsgId',
							isArray: false
						},
						viewed: {
							method: 'PUT',
							url: '/api/messages/:messageId/viewed',
							params: { messageId: '@messageId' },
							isArray: false
						},
						actioned: {
							method: 'PUT',
							url: '/api/messages/:messageId/action',
							params: { messageId: '@messageId' },
							isArray: false
						}
					}
				);
				angular.extend(Payload.prototype, {
					createOrUpdate() {
						const message = this;
						if (message._id) {
							return message.$update(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						} else {
							return message.$save(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						}
					}
				});
				return Payload;
			}
		])
		// -------------------------------------------------------------------------
		//
		// service for database interaction - the $resource for messages
		//
		// -------------------------------------------------------------------------
		.factory('MessageTemplatesService', [
			'$resource',
			'$log',
			($resource, $log) => {
				const Payload = $resource(
					'/api/messagetemplates/:templateId',
					{
						templateId: '@_id'
					},
					{ update: { method: 'PUT' } }
				);
				angular.extend(Payload.prototype, {
					createOrUpdate() {
						const messagetemplate = this;
						if (messagetemplate._id) {
							return messagetemplate.$update(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						} else {
							return messagetemplate.$save(
								() => {
									return;
								},
								e => {
									$log.error(e.data);
								}
							);
						}
					}
				});
				return Payload;
			}
		]);
})();
