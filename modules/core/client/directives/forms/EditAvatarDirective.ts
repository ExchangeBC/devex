'use strict';

import angular, { IController, IScope, ui } from 'angular';
import { IOrg } from '../../../../orgs/shared/IOrgDTO';
import { IAuthenticationService } from '../../../../users/client/services/AuthenticationService';
import { IUser } from '../../../../users/shared/IUserDTO';
import { EditAvatarDialogController } from '../../controllers/EditAvatarDialogController';

interface EditOrgImageDirectiveScope extends IScope {
	org?: IOrg;
}

class EditAvatarDirectiveController implements IController {
	public static $inject = ['$uibModal', '$scope', 'AuthenticationService'];
	public org: IOrg;
	public user: IUser;

	constructor(private $uibModal: ui.bootstrap.IModalService, private $scope: EditOrgImageDirectiveScope, private AuthenticationService: IAuthenticationService) {
		this.org = this.$scope.org;
		this.user = this.AuthenticationService.user;
	}

	public async edit(): Promise<void> {
		this.$uibModal.open({
			size: 'lg',
			templateUrl: '/modules/core/client/views/change-avatar-modal.html',
			controllerAs: 'qqq',
			resolve: {
				org: () => {
					return this.org;
				},
				user: () => {
					return this.user;
				}
			},
			controller: EditAvatarDialogController
		});
	}

	public getImageUrl(): string {
		let url = this.org ? this.org.orgImageURL : this.user.profileImageURL;
		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
			url = '/' + url;
		}
		return url;
	}

	public getShapeClass(): string {
		return this.org ? 'rounded' : 'rounded-circle';
	}
}

angular.module('core').directive('editAvatar', () => {
	return {
		scope: {
			org: '=',
			user: '='
		},
		controllerAs: 'vm',
		restrict: 'EAC',
		template: '<img class="mr-3 {{vm.getShapeClass()}} edit-image border" uib-tooltip="Click to edit" src="{{vm.getImageUrl()}}" height="60" width="60" ng-click="vm.edit()">',
		controller: EditAvatarDirectiveController
	}
});
