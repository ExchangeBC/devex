'use strict';

import angular, { resource } from 'angular';
import { IUserResource } from './UsersService';

export interface IAdminService extends resource.IResourceClass<IUserResource> {
	update(user: IUserResource): IUserResource;
}

angular.module('users.admin.services').factory('AdminService', [
	'$resource',
	($resource: resource.IResourceService): IAdminService => {
		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		return $resource(
			'/api/users/:userId',
			{
				userId: '@_id'
			},
			{
				update: updateAction
			}
		) as IAdminService;
	}
]);
