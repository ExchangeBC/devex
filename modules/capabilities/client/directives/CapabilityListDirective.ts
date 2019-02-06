'use strict';

import angular, { IController, IRootScopeService, IScope } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { ICapability } from '../../shared/ICapabilityDTO';
import { ICapabilitiesService } from '../services/CapabilitiesService';

interface ICapabilityListDirectiveScope extends IScope {
	capabilities: ICapability[];
}

class CapabilityListDirectiveController implements IController {
	public static $inject = ['$rootScope', '$scope', 'CapabilitiesService', 'AuthenticationService'];

	public canAdd: boolean;
	public capabilities: ICapability[];
	public editingEnabled: boolean;

	constructor(
		private $rootScope: IRootScopeService,
		private $scope: ICapabilityListDirectiveScope,
		private CapabilitiesService: ICapabilitiesService,
		private AuthenticationService: IAuthenticationService
	) {
		this.editingEnabled = window.allowCapabilityEditing;
		this.capabilities = this.$scope.capabilities;
		this.canAdd = this.AuthenticationService.user && this.AuthenticationService.user.roles.includes('admin');
		this.$rootScope.$on('updateCapabilities', () => {
			this.capabilities = this.CapabilitiesService.query();
		});
	}
}

angular.module('capabilities').directive('capabilityList', () => {
	return {
		restrict: 'E',
		controllerAs: 'vm',
		scope: {
			capabilities: '='
		},
		templateUrl: '/modules/capabilities/client/views/list.capabilities.directive.html',
		controller: CapabilityListDirectiveController
	};
});
