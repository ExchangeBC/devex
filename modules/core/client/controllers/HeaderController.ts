'use strict';

import angular, { IController, idle, IRootScopeService, IScope, ui } from 'angular';
import { IMessagesService } from '../../../messages/client/services/MessagesService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IUser } from '../../../users/shared/IUserDTO';
import { IMenuService } from '../services/MenuService';

class HeaderController implements IController {
	public static $inject = ['$rootScope', '$scope', 'AuthenticationService', 'MenuService', 'MessagesService', '$uibModal', 'Idle'];
	public accountMenu: any;
	public isCollapsed: boolean;
	public menu: any;
	public messageCount: number;
	public avatarImageUrl: string;
	public user: IUser;

	private warning: ui.bootstrap.IModalInstanceService;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: IScope,
		private AuthenticationService: IAuthenticationService,
		private MenuService: IMenuService,
		private MessagesService: IMessagesService,
		private $uibModal: ui.bootstrap.IModalService,
		private Idle: idle.IIdleService
	) {
		this.refreshHeader();
		this.isCollapsed = false;
		this.menu = this.MenuService.getMenu('topbar');
		this.setScopeBindings();
		this.setupIdleTimeout();
	}

	private refreshHeader(): void {
		this.accountMenu = this.MenuService.getMenu('account').items[0];
		this.user = this.AuthenticationService.user;
		if (this.user) {
			this.updateMessageCount();
			this.setAvatarImage(this.user);
			this.Idle.watch();
		}
	}

	private async updateMessageCount(): Promise<void> {
		const response = await this.MessagesService.mycount().$promise;
		this.messageCount = response.count;
	}

	private setAvatarImage(user: IUser): void {
		if (user.profileImageURL.indexOf('http://') !== 0 && user.profileImageURL.indexOf('https://') !== 0) {
			this.avatarImageUrl = `${window.location.origin}/${user.profileImageURL}`;
		} else {
			this.avatarImageUrl = user.profileImageURL;
		}
	}

	// Set up bindings on root scope so that the header updates appropriately
	private setScopeBindings(): void {
		this.$rootScope.$on('updateMessageCount', () => {
			this.updateMessageCount();
		});

		this.$rootScope.$on('userSignedIn', () => {
			this.refreshHeader();
		});

		this.$rootScope.$on('userImageUpdated', () => {
			this.refreshHeader();
		});

		this.$scope.$on('$stateChangeSuccess', this.stateChangeSuccess);
	}

	private setupIdleTimeout(): void {
		this.$scope.$on('IdleStart', () => {
			this.warning = this.$uibModal.open({
				size: 'sm',
				animation: true,
				templateUrl: '/modules/core/client/views/modal.timeout.warning.html',
				windowClass: 'modal-timeout-warning-dialog',
				backdrop: 'static',
				bindToController: true,
				controllerAs: 'qqq',
				controller: 'WarningModalController'
			});
		});

		this.$scope.$on('IdleEnd', () => {
			this.warning.close();
		});

		this.$scope.$on('IdleTimeout', async (): Promise<void> => {
			this.warning.close();

			// Tell server to terminate the session
			await fetch('/api/auth/signout', {
				method: 'GET',
				headers: {
					'Content-Type': 'text/plain;charset=UTF-8'
				}
			});

			// Open the timed out modal with option for user to sign back in
			this.$uibModal.open({
				size: 'sm',
				templateUrl: '/modules/core/client/views/modal.timeout.html',
				windowClass: 'modal-timeout-dialog',
				backdrop: 'static',
				bindToController: true,
				controllerAs: 'qqq',
				controller: 'TimeoutModalController'
			});
		});
	}

	private stateChangeSuccess(): void {
		this.isCollapsed = false;
	}
}

angular.module('core').controller('HeaderController', HeaderController);
