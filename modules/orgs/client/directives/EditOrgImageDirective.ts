'use strict';

import angular, { IController, IScope, ui } from 'angular';
import { IOrg } from '../../shared/IOrgDTO';
import { EditOrgImageDialogController } from '../controllers/EditOrgImageDialogController';

interface EditOrgImageDirectiveScope extends IScope {
	org: IOrg;
}

class EditOrgImageDirectiveController implements IController {
	public static $inject = ['$uibModal', '$scope'];
	public org: IOrg;
	public uploadUrl: string;
	public blockingObject = { block: true };

	constructor(private $uibModal: ui.bootstrap.IModalService, private $scope: EditOrgImageDirectiveScope) {
		this.org = this.$scope.org;
		this.uploadUrl = `/api/org/${this.org._id}/upload/logo`;
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
			controller: EditOrgImageDialogController
		});
	}
}

angular.module('orgs').directive('editOrgImage', () => {
	return {
		scope: {
			org: '='
		},
		controllerAs: 'wsx',
		restrict: 'EAC',
		template: '<button class="btn btn-sm btn-default" ng-click="wsx.edit()">Update logo</button>',
		controller: EditOrgImageDirectiveController
	}
});
