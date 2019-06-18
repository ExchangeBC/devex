'use strict';

import angular, { IPromise, resource } from 'angular';
import { IMessage, IMessageCountResponse } from '../../shared/IMessageDTO';

interface IMessageServiceParams {
	messageId?: string;
}

export interface IMessageResource extends resource.IResource<IMessage>, IMessage {
	messageId: string;
	$promise: IPromise<IMessageResource>;
}

export interface IMessagesService extends resource.IResourceClass<IMessageResource> {
	update(message: IMessageResource): IMessageResource;
	my(): IMessageResource[];
	mycount(): resource.IResource<IMessageCountResponse>;
	actioned(params: IMessageServiceParams): IMessageResource;
}

angular.module('messages.services').factory('MessagesService', [
	'$resource',
	($resource: resource.IResourceService): IMessagesService => {

		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		const myAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/messages',
			isArray: true
		};

		const myCountAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/messages/count',
			isArray: false
		};

		const actionedAction: resource.IActionDescriptor = {
			method: 'PUT',
			url: '/api/messages/:messageId/action',
			params: { messageId: '@messageId' },
			isArray: false
		};

		return $resource(
			'/api/messages/:messageId',
			{
				messageId: '@_id'
			},
			{
				update: updateAction,
				my: myAction,
				mycount: myCountAction,
				actioned: actionedAction
			}
		) as IMessagesService;
	}
]);
