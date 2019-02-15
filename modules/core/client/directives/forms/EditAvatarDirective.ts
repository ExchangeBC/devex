'use strict';

import angular, { IController, IScope, ui } from 'angular';
import { IOrg } from '../../../../orgs/shared/IOrgDTO';
import { EditAvatarDialogController } from '../../controllers/EditAvatarDialogController';

interface EditOrgImageDirectiveScope extends IScope {
	org: IOrg;
}

class EditAvatarDirectiveController implements IController {
	public static $inject = ['$uibModal', '$scope'];
	public org: IOrg;
	public blockingObject = { block: true };

	constructor(private $uibModal: ui.bootstrap.IModalService, private $scope: EditOrgImageDirectiveScope) {
		this.org = this.$scope.org;
	}

	public async edit(): Promise<void> {
		this.$uibModal.open({
			size: 'lg',
			templateUrl: '/modules/orgs/client/views/change-logo-modal.html',
			controllerAs: 'qqq',
			resolve: {
				org: () => {
					return this.org;
				}
			},
			controller: EditAvatarDialogController
		});
	}
}

angular.module('orgs').directive('editAvatar', () => {
	return {
		scope: {
			org: '='
		},
		controllerAs: 'wsx',
		restrict: 'EAC',
		// template: '<button class="btn btn-sm btn-default" ng-click="wsx.edit()">Update logo</button>',
		template: '<img class="mr-3 rounded edit-image" uib-tooltip="Click to edit" src="/{{wsx.org.orgImageURL}}" height="60" width="60" ng-click="wsx.edit()">',
		controller: EditAvatarDirectiveController
	}
});
