'use strict';

import { Ng1StateDeclaration } from '@uirouter/angularjs';
import { StateService } from '@uirouter/core';
import angular, { IController, IRootScopeService, IScope, IWindowService, uiNotification } from 'angular';
import { IAuthenticationService } from '../../services/AuthenticationService';
import { IUserService } from '../../services/UsersService';

interface ICredentials {
	username: string;
	password: string;
}

interface StateServiceWithPrevious extends StateService {
	previous?: {
		state: Ng1StateDeclaration;
		params: any;
		href: any;
	};
}

export class AuthenticationController implements IController {
	public static $inject = ['$scope', '$rootScope', '$state', 'UsersService', '$window', 'AuthenticationService', 'Notification'];

	public credentials: ICredentials;

	constructor(
		private $scope: IScope,
		private $rootScope: IRootScopeService,
		private $state: StateServiceWithPrevious,
		private UsersService: IUserService,
		private $window: IWindowService,
		private AuthenticationService: IAuthenticationService,
		private Notification: uiNotification.INotificationService
	) {
		this.credentials = {
			username: '',
			password: ''
		};
	}

	public async signin(isValid: boolean): Promise<void> {
		if (!isValid) {
			this.$scope.$broadcast('show-errors-check-validity', 'vm.userForm');
			return;
		}

		try {
			const signedInUser = await this.UsersService.signin(this.credentials).$promise;
			this.AuthenticationService.user = signedInUser;

			// Emit an event up communicating a user has signed in so application updates appropriately
			this.$rootScope.$broadcast('userSignedIn', signedInUser);
			this.$state.go('home', this.$state.params);
		} catch (error) {
			this.Notification.error({
				title: 'Error',
				message: '<i class="fas fa-exclamation-triangle"></i> Invalid username or password'
			});
		}
	}

	public callOauthProvider(url: string): void {
		if (this.$state.previous && this.$state.previous.href) {
			sessionStorage.setItem('prevState', this.$state.previous.state.name);
			sessionStorage.setItem('prevParams', JSON.stringify(this.$state.previous.params));
		}

		// Effectively call OAuth authentication route:
		this.$window.location.href = url;
	}
}

angular.module('users').controller('AuthenticationController', AuthenticationController);
