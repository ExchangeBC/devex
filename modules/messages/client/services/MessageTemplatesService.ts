'use strict';

import angular, { resource } from 'angular';
import { IMessageTemplate } from '../../shared/IMessageDTO';

export interface IMessageTemplateResource extends resource.IResource<IMessageTemplate>, IMessageTemplate {
	templateId: string;
}

export interface IMessageTemplatesService extends resource.IResourceClass<IMessageTemplateResource> {}

angular.module('messages.services').factory('MessageTemplatesService', [
	'$resource',
	($resource: resource.IResourceService): IMessageTemplatesService => {
		return $resource(
			'/api/messagetemplates/:templateId',
			{
				templateId: '@_id'
			},
			{}
		) as IMessageTemplatesService;
	}
]);
