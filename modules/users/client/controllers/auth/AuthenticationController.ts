'use strict';

import angular, { IController, IScope, IRootScopeService, IWindowService, uiNotification } from 'angular';
import { IStateService, IState } from 'angular-ui-router';
import { IUserService } from '../../services/UsersService';
import { IAuthenticationService } from '../../services/AuthenticationService';

interface ICredentials {
	username: string;
	password: string;
}

interface IStateServiceWithPrevious extends IStateService {
	previous?: {
		state: IState;
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
		private $state: IStateServiceWithPrevious,
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

			if (this.$state.previous && this.$state.previous.state) {
				this.$state.go(this.$state.previous.state.name, this.$state.previous.state.params);
			} else {
				this.$state.go('home', this.$state.params);
			}
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
