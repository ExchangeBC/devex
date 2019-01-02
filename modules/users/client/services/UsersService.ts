'use strict';

import angular, { IPromise, resource } from 'angular';
import { IUser } from '../../shared/IUserDTO';

interface IUserServiceParams {
	token?: string;
	username?: string;
	password?: string;
	currentPassword?: string;
	newPassword?: string;
	verifyPassword?: string;
}

export interface IUserResource extends resource.IResource<IUserResource>, IUser {
	$promise: IPromise<IUserResource>;
}

export interface IUserService extends resource.IResourceClass<IUserResource> {
	update(user: IUserResource): IUserResource;
	removeSelf(): IUserResource;
	updatePassword(params: IUserServiceParams): void;
	self(): IUserResource;
	sendPasswordResetToken(params: IUserServiceParams): string;
	resetPasswordWithToken(params: IUserServiceParams): void;
	signup(params: IUserServiceParams): IUserResource;
	signin(params: IUserServiceParams): IUserResource;
	signout(): void;
}

angular.module('users.services').factory('UsersService', [
	'$resource',
	($resource: resource.IResourceService): IUserService => {
		const updateAction: resource.IActionDescriptor = {
			method: 'PUT'
		};

		const removeSelfAction: resource.IActionDescriptor = {
			method: 'DELETE'
		};

		const updatePasswordAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/users/password'
		};

		const selfAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/users/me'
		};

		const sendPasswordResetTokenAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/auth/forgot'
		};

		const resetPasswordWithTokenAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/auth/reset/:token'
		};

		const signupAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/auth/signup'
		};

		const signinAction: resource.IActionDescriptor = {
			method: 'POST',
			url: '/api/auth/signin'
		};

		const signoutAction: resource.IActionDescriptor = {
			method: 'GET',
			url: '/api/auth/signout'
		};

		return $resource(
			'/api/users',
			{},
			{
				update: updateAction,
				removeSelf: removeSelfAction,
				updatePassword: updatePasswordAction,
				self: selfAction,
				sendPasswordResetToken: sendPasswordResetTokenAction,
				resetPasswordWithToken: resetPasswordWithTokenAction,
				signup: signupAction,
				signin: signinAction,
				signout: signoutAction
			}
		) as IUserService;
	}
]);
