'use strict';

import angular, { IPromise, resource } from 'angular';

interface ICoreServiceParams {
	token?: string;
	email?: string;
	name?: string;
}
interface ICoreResource extends resource.IResource<ICoreResource> {
	message: string;
	$promise: IPromise<ICoreResource>;
}

export interface ICoreService extends resource.IResourceClass<ICoreResource> {
	verifyRecaptcha(params: ICoreServiceParams): ICoreResource;
	registerEmail(params: ICoreServiceParams): ICoreResource;
	unregisterEmail(params: ICoreServiceParams): ICoreResource;
}

angular.module('core').factory('CoreService', [
	'$resource',
	($resource: resource.IResourceService): ICoreService => {
		return $resource(
			'/newsletter',
			{},
			{
				verifyRecaptcha: {
					method: 'POST',
					url: '/newsletter/verify'
				},
				registerEmail: {
					method: 'POST',
					url: '/newsletter/register'
				},
				unregisterEmail: {
					method: 'DELETE',
					url: '/newsletter/register'
				}
			}
		) as ICoreService;
	}
]);
